import { SnowflakeFormDetails } from '@pages/ingestion/base/sources/SnowflakeSource';
import { test } from '../../fixtures/base-test';
import { IngestionV3Page } from '../../pages/ingestion/v3/ingestion-v3.page';
import crypto from 'crypto';

const FIXTURE_SECRET_NAME = 'playwright-v3-ingestion-secret';

function randomSuffix() {
  return crypto.randomBytes(4).toString('hex');
}

test.use({ featureName: 'ingestion-v3' });

test.describe('secrets tab in manage data sources', () => {
  let ingestionPage: IngestionV3Page;

  test.beforeEach(async ({ page, apiMock, logger, logDir }) => {
    ingestionPage = new IngestionV3Page(page, logger, logDir);

    await apiMock.setFeatureFlags({
      showIngestionPageRedesign: true,
      ingestionOnboardingRedesignV1: true,
      showNavBarRedesign: true,
    });

    await apiMock.suppressOnboardingModals();

    await ingestionPage.goto();
    await ingestionPage.secretsTab.open();
  });

  test('create and delete a secret', async () => {
    const suffix = randomSuffix();
    const secretName = `playwright_secret_${suffix}`;
    const secretValue = `secret-value-${suffix}`;
    const secretDescription = `playwright test secret description ${suffix}`;

    await ingestionPage.secretsTab.createSecret(secretName, secretValue, secretDescription);
    await ingestionPage.secretsTab.expectSecretVisible(secretName);
    await ingestionPage.secretsTab.expectSecretVisible(secretDescription);

    await ingestionPage.secretsTab.deleteSecret(secretName);
    await ingestionPage.secretsTab.expectSecretNotVisible(secretName);
    await ingestionPage.secretsTab.expectSecretNotVisible(secretDescription);
  });

  test('create ingestion source using a secret', async () => {
    test.slow();

    const suffix = randomSuffix();
    const sourceName = `ingestion source ${suffix}`;
    const sourceDetails: SnowflakeFormDetails = {
      accountId: `account_${suffix}`,
      warehouseId: `warehouse_${suffix}`,
      username: `user_${suffix}`,
      role: `role_${suffix}`,
      authenticationType: 'userNameAndPassword',
      passwordSecret: FIXTURE_SECRET_NAME,
    };

    await ingestionPage.sourcesTab.open();
    await ingestionPage.sourcesTab.createIngestionSource(sourceName, {
      sourceType: 'Snowflake',
      fillForm: async () => {
        await ingestionPage.sourcesTab.snowflakeSource.fillForm(sourceDetails);
      },
    });
    await ingestionPage.sourcesTab.expectSourceVisible(sourceName);
    await ingestionPage.sourcesTab.expectSourceStatusPending(sourceName);
    await ingestionPage.sourcesTab.deleteIngestionSource(sourceName);
  });

  test('deleted secret is absent from password dropdown', async () => {
    const suffix = randomSuffix();
    const secretName = `playwright_deleted_secret_${suffix}`;
    const secretValue = `secret-value-${suffix}`;

    await ingestionPage.secretsTab.createSecret(secretName, secretValue);
    await ingestionPage.secretsTab.deleteSecret(secretName);

    await ingestionPage.sourcesTab.open();
    await ingestionPage.sourcesTab.openCreateSourceModal();
    await ingestionPage.sourcesTab.selectSourceType('Snowflake');
    await ingestionPage.sourcesTab.snowflakeSource.fillAuthenticationType({
      authenticationType: 'userNameAndPassword',
    });
    await ingestionPage.sourcesTab.snowflakeSource.expectSecretAbsentInPasswordDropdown(secretName);
    await ingestionPage.sourcesTab.cancelCreateSourceModal();
  });

  test('create secret inline during source creation', async () => {
    test.slow();

    const suffix = randomSuffix();
    const sourceName = `ingestion source inline ${suffix}`;
    const secretName = `playwright_inline_secret_${suffix}`;
    const secretValue = `secret-value-${suffix}`;
    const sourceDetails: SnowflakeFormDetails = {
      accountId: `account_${suffix}`,
      warehouseId: `warehouse_${suffix}`,
      username: `user_${suffix}`,
      role: `role_${suffix}`,
      authenticationType: 'userNameAndPassword',
    };

    await ingestionPage.sourcesTab.open();
    await ingestionPage.sourcesTab.createIngestionSource(sourceName, {
      sourceType: 'Snowflake',
      fillForm: async () => {
        await ingestionPage.sourcesTab.snowflakeSource.fillForm(sourceDetails);
        await ingestionPage.sourcesTab.createSecretInlineForPassword(secretName, secretValue);
      },
    });
    await ingestionPage.sourcesTab.expectSourceVisible(sourceName);
    await ingestionPage.sourcesTab.expectSourceStatusPending(sourceName);

    await ingestionPage.sourcesTab.deleteIngestionSource(sourceName);
    await ingestionPage.secretsTab.navigate();
    await ingestionPage.secretsTab.deleteSecret(secretName);
  });
});
