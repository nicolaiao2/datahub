import { expect, Page, Locator } from '@playwright/test';
import { SnowflakeFormDetails, SnowflakeSource } from '@pages/ingestion/base/sources/SnowflakeSource';
import { DataHubLogger } from '@utils/logger';

export class SnowflakeSourceV3 extends SnowflakeSource {
  readonly yamlSwitcherButton: Locator;

  constructor(page: Page, logger?: DataHubLogger, logDir?: string) {
    super(page, logger, logDir);
    this.yamlSwitcherButton = page.locator('[data-testid="yaml-editor-tab"]');
  }

  getYamlSwitcherButton(): Locator {
    return this.yamlSwitcherButton;
  }

  async waitForForm(): Promise<void> {
    await this.page.getByText('Snowflake Connection Details').waitFor({ state: 'visible' });
  }

  override async expectFormValues(details: Partial<SnowflakeFormDetails>): Promise<void> {
    const { authenticationType, ...otherDetails } = details;
    // Check all fields except authenticationType first so prior checks don't scroll it off-screen
    await super.expectFormValues(otherDetails);

    if (authenticationType) {
      // Same scroll workaround as fillAuthenticationType: auth type select not added to DOM when off-screen.
      // Must scroll to role first (below auth type), then username (above auth type) to bring it into view.
      await this.roleInput.scrollIntoViewIfNeeded();
      await this.usernameInput.scrollIntoViewIfNeeded();
      const displayText = authenticationType === 'privateKey' ? 'Key' : 'Username & Password';
      // The v3 form renders auth type with a custom component (no #authentication_type hidden input).
      // Verify by checking the displayed value within the form row containing the "Authentication Type" label.
      // ancestor::div[2] from the label <p>: level 1 = label wrapper, level 2 = field row containing the select.
      const authTypeRow = this.page.locator('p:text-is("Authentication Type")').locator('xpath=ancestor::div[2]');
      await expect(authTypeRow).toContainText(displayText);
    }
  }

  async fillAuthenticationType(details: SnowflakeFormDetails): Promise<void> {
    if (details.authenticationType) {
      // FYI: there is a bug when select is not in visible area it isn't added to DOM
      // so we scroll to element below and only then works with select
      await this.roleInput.scrollIntoViewIfNeeded();
      await this.usernameInput.scrollIntoViewIfNeeded();

      await this.authenticationTypeField.scrollIntoViewIfNeeded();
      await this.authenticationTypeField.click({ force: true });
      const optionDataTestId = `option-${details.authenticationType === 'privateKey' ? 'KEY_PAIR_AUTHENTICATOR' : 'DEFAULT_AUTHENTICATOR'}`;
      await this.page.locator(`[data-testid="${optionDataTestId}"]`).first().click({ force: true });
    }
  }
}
