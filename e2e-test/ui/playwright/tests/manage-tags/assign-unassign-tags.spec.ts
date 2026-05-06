/**
 * Manage Tags — assign / unassign tests
 * Migrated from: smoke-test/tests/cypress/cypress/e2e/manage_tagsV2/assign_unassign_tags.js
 *
 * Tests:
 *   1. Assign a preseeded tag to a dataset, verify it appears on the entity and
 *      in tag-filtered search results, then unassign it and verify it disappears.
 *
 * The tag used in this test is preseeded via manage-tags/fixtures/data.json so
 * the test does not need to create or delete it, reducing flakiness.
 */

import { test } from '../../fixtures/base-test';
import { DatasetPage } from '../../pages/dataset.page';
import { SearchPage } from '../../pages/search.page';

test.use({ featureName: 'manage-tags' });

const SAMPLE_DATASET_URN = 'urn:li:dataset:(urn:li:dataPlatform:hive,SamplePlaywrightHiveDataset,PROD)';
const SAMPLE_DATASET_NAME = 'SamplePlaywrightHiveDataset';

const TAG_NAME = 'playwright_assign_unassign_tag';

// ── Tests ────────────────────────────────────────────────────────────────────

test.describe('tags - assign/unassign', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('skipOnboardingTour', 'true');
      localStorage.setItem('skipWelcomeModal', 'true');
      localStorage.setItem('skipAcrylIntroducePage', 'true');
    });
  });

  test('should allow to assign/unassign tags on a dataset', async ({ page, logger, logDir }) => {
    test.setTimeout(180_000);

    const datasetPage = new DatasetPage(page, logger, logDir);
    const searchPage = new SearchPage(page, logger, logDir);

    // ── Assign the tag to the dataset ────────────────────────────────────
    await datasetPage.navigateToDataset(SAMPLE_DATASET_URN, SAMPLE_DATASET_NAME);
    await datasetPage.assignTag(TAG_NAME);
    await datasetPage.expectTagAssigned(TAG_NAME);

    // ── Verify the tag filter includes the dataset ────────────────────────
    await searchPage.searchByTag(TAG_NAME);
    await searchPage.expectEntityInSearchResults(SAMPLE_DATASET_URN);

    // ── Unassign the tag from the dataset ────────────────────────────────
    await datasetPage.navigateToDataset(SAMPLE_DATASET_URN, SAMPLE_DATASET_NAME);
    await datasetPage.unassignTag(TAG_NAME);
    await datasetPage.expectTagNotAssigned(TAG_NAME);

    // ── Verify the tag filter no longer includes the dataset ─────────────
    await searchPage.searchByTag(TAG_NAME);
    await searchPage.expectEntityNotInSearchResults(SAMPLE_DATASET_URN);
  });
});
