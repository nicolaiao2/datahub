/**
 * Glossary Sidebar Navigation tests — migrated from Cypress e2e/glossaryV2/v2_glossary_navigation.js
 *
 * Tests the move and sidebar navigation behaviour for glossary entities.
 */

import { test } from '../../fixtures/base-test';
import { GlossaryPage } from '../../pages/glossary.page';
import { withRandomSuffix } from '../../utils/random';

test.use({ featureName: 'glossary' });

test.describe('glossary sidebar navigation', () => {
  let glossaryPage: GlossaryPage;

  test.beforeEach(async ({ page, logger, logDir }) => {
    glossaryPage = new GlossaryPage(page, logger, logDir);
    await glossaryPage.navigateToGlossary();
  });

  test('can move a term into its parent term group', async ({ cleanup }) => {
    const termGroup = withRandomSuffix('NavGroup');
    const term = withRandomSuffix('NavTerm');

    const termGroupUrn = await glossaryPage.createTermGroup(termGroup);
    cleanup.track(termGroupUrn);

    await glossaryPage.navigateToGlossary();
    await glossaryPage.clickSidebarItem(termGroup);
    await glossaryPage.navigateToEntityContentsTab();
    const termUrn = await glossaryPage.createTermInContentsTab(term);
    cleanup.track(termUrn);

    await glossaryPage.navigateToGlossaryTerm(term);
    await glossaryPage.moveCurrentEntityTo(termGroup);

    await glossaryPage.clickSidebarItem(termGroup);
    await glossaryPage.navigateToEntityContentsTab();
    await glossaryPage.expectTextVisible(term);
  });

  test('Properties tab persists when switching between terms', async ({ cleanup }) => {
    const termGroup = withRandomSuffix('NavGroup');
    const term1 = withRandomSuffix('NavTerm1');
    const term2 = withRandomSuffix('NavTerm2');

    const termGroupUrn = await glossaryPage.createTermGroup(termGroup);
    cleanup.track(termGroupUrn);

    await glossaryPage.navigateToGlossary();
    await glossaryPage.clickSidebarItem(termGroup);
    await glossaryPage.navigateToEntityContentsTab();
    const term1Urn = await glossaryPage.createTermInContentsTab(term1);
    cleanup.track(term1Urn);

    await glossaryPage.navigateToGlossaryTerm(termGroup);
    await glossaryPage.navigateToEntityContentsTab();
    const term2Urn = await glossaryPage.createTermInContentsTab(term2);
    cleanup.track(term2Urn);

    await glossaryPage.navigateToGlossaryTerm(term1);
    await glossaryPage.navigateToEntityPropertiesTab();
    await glossaryPage.expectPropertiesTabActive();

    await glossaryPage.navigateToGlossaryTerm(term2);
    await glossaryPage.expectPropertiesTabActive();
  });

  test('can move a term group under a parent node', async ({ cleanup }) => {
    const parentNode = withRandomSuffix('NavParent');
    const termGroup = withRandomSuffix('NavGroup');

    const parentNodeUrn = await glossaryPage.createTermGroup(parentNode);
    cleanup.track(parentNodeUrn);

    await glossaryPage.navigateToGlossary();
    const termGroupUrn = await glossaryPage.createTermGroup(termGroup);
    cleanup.track(termGroupUrn);

    await glossaryPage.navigateToGlossary();
    await glossaryPage.navigateToGlossaryTerm(termGroup);
    await glossaryPage.moveCurrentEntityTo(parentNode);

    await glossaryPage.clickSidebarItem(parentNode);
    await glossaryPage.navigateToEntityContentsTab();
    await glossaryPage.expectTextVisible(termGroup);
  });
});
