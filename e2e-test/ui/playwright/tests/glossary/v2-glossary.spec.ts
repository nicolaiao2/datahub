/**
 * Glossary V2 tests — migrated from Cypress e2e/glossaryV2/v2_glossary.js
 *
 * Tests the full lifecycle of a Glossary Term Group and Glossary Term:
 *   1. Create a root-level Term Group.
 *   2. Create a Glossary Term inside the group.
 *   3. Assign the term to a dataset via the entity sidebar.
 *   4. Delete the term; verify it is no longer visible.
 *   5. Delete the term group; verify it is no longer visible.
 *
 * Prerequisites:
 *   `SamplePlaywrightGlossaryDataset` dataset must exist (seeded via fixtures/data.json).
 */

import { test } from '../../fixtures/base-test';
import { GlossaryPage } from '../../pages/glossary.page';
import { DatasetPage } from '../../pages/dataset.page';
import { withRandomSuffix } from '../../utils/random';

test.use({ featureName: 'glossary' });

const DATASET_URN = 'urn:li:dataset:(urn:li:dataPlatform:hdfs,SamplePlaywrightGlossaryDataset,PROD)';

test.describe('glossary term group and term lifecycle', () => {
  let glossaryPage: GlossaryPage;

  test.beforeEach(async ({ page, logger, logDir }) => {
    glossaryPage = new GlossaryPage(page, logger, logDir);
    await glossaryPage.navigateToGlossary();
  });

  test('create term group at root level', async () => {
    const termGroupName = withRandomSuffix('GlossaryGroup');

    await glossaryPage.createTermGroup(termGroupName);

    await glossaryPage.navigateToGlossary();
    await glossaryPage.expectTextVisible(termGroupName);

    // Cleanup
    await glossaryPage.navigateToGlossaryTerm(termGroupName);
    await glossaryPage.deleteCurrentEntity();
  });

  test('create glossary term inside term group', async ({ cleanup }) => {
    const termGroupName = withRandomSuffix('GlossaryGroup');
    const termName = withRandomSuffix('GlossaryTerm');

    const termGroupUrn = await glossaryPage.createTermGroup(termGroupName);
    cleanup.track(termGroupUrn);
    await glossaryPage.navigateToGlossary();
    await glossaryPage.navigateToGlossaryTerm(termGroupName);
    await glossaryPage.navigateToEntityContentsTab();
    const termUrn = await glossaryPage.createTermInContentsTab(termName);
    cleanup.track(termUrn);

    await glossaryPage.expectTextVisible(termName);
  });

  test('add glossary term to dataset via sidebar', async ({ page, logger, logDir, cleanup }) => {
    const termGroupName = withRandomSuffix('GlossaryGroup');
    const termName = withRandomSuffix('GlossaryTerm');

    const termGroupUrn = await glossaryPage.createTermGroup(termGroupName);
    cleanup.track(termGroupUrn);
    await glossaryPage.navigateToGlossary();
    await glossaryPage.navigateToGlossaryTerm(termGroupName);
    await glossaryPage.navigateToEntityContentsTab();
    const termUrn = await glossaryPage.createTermInContentsTab(termName);
    cleanup.track(termUrn);

    const datasetPage = new DatasetPage(page, logger, logDir);
    await datasetPage.navigateToDataset(DATASET_URN);
    await datasetPage.addGlossaryTerm(termName);
    await datasetPage.expectGlossaryTermVisible(termName);
    await datasetPage.removeGlossaryTerm(termName);
    await datasetPage.expectGlossaryTermNotVisible(termName);
  });

  test('delete glossary term', async ({ cleanup }) => {
    const termGroupName = withRandomSuffix('GlossaryGroup');
    const termName = withRandomSuffix('GlossaryTerm');

    const termGroupUrn = await glossaryPage.createTermGroup(termGroupName);
    cleanup.track(termGroupUrn);
    await glossaryPage.navigateToGlossary();
    await glossaryPage.navigateToGlossaryTerm(termGroupName);
    await glossaryPage.navigateToEntityContentsTab();
    await glossaryPage.createTermInContentsTab(termName);

    await glossaryPage.navigateToGlossaryTerm(termName);
    await glossaryPage.deleteCurrentEntity();

    await glossaryPage.navigateToGlossary();
    await glossaryPage.navigateToGlossaryTerm(termGroupName);
    await glossaryPage.expectTextNotPresent(termName);
  });

  test('delete term group', async () => {
    const termGroupName = withRandomSuffix('GlossaryGroup');

    await glossaryPage.createTermGroup(termGroupName);

    await glossaryPage.navigateToGlossary();
    await glossaryPage.navigateToGlossaryTerm(termGroupName);
    await glossaryPage.deleteCurrentEntity();

    await glossaryPage.navigateToGlossary();
    await glossaryPage.expectTextNotPresent(termGroupName);
  });
});
