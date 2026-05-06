/**
 * Manage Tags — create / edit / remove tests
 * Migrated from: smoke-test/tests/cypress/cypress/e2e/manage_tagsV2/create_edit_remove_tags.js
 *
 * Tests:
 *   1. Create a tag, verify it appears in the table, try to create a duplicate
 *      (expect failure), edit its description, verify the update, then delete it.
 *
 * Each test run uses a unique tag name so that runs are isolated and can be
 * executed in parallel.
 */

import { test } from '../../fixtures/base-test';
import { TagsPage } from '../../pages/tags.page';
import { withRandomSuffix } from '../../utils/random';

const TAG_NAME = withRandomSuffix('playwright_tag_create_edit_remove');

const TAG_CREATE_EDIT_REMOVE = {
  name: TAG_NAME,
  description: `${TAG_NAME} description`,
  editedDescription: `${TAG_NAME} description edited`,
};

// ── Tests ────────────────────────────────────────────────────────────────────

test.describe('tags - create/edit/remove', () => {
  test.beforeEach(async ({ page }) => {
    // Suppress the onboarding tour so it does not intercept pointer events
    await page.addInitScript(() => {
      localStorage.setItem('skipOnboardingTour', 'true');
      localStorage.setItem('skipWelcomeModal', 'true');
      localStorage.setItem('skipAcrylIntroducePage', 'true');
    });
  });

  test('should allow to create/edit/remove tags on tags page', async ({ page, logger, logDir }) => {
    const tagsPage = new TagsPage(page, logger, logDir);

    // ── Create ──────────────────────────────────────────────────────────────
    await tagsPage.navigate();

    await tagsPage.createTag(TAG_CREATE_EDIT_REMOVE.name, TAG_CREATE_EDIT_REMOVE.description);

    await tagsPage.expectTagInTable(TAG_CREATE_EDIT_REMOVE.name, TAG_CREATE_EDIT_REMOVE.description);

    // ── Duplicate should fail ───────────────────────────────────────────────
    await tagsPage.createTag(TAG_CREATE_EDIT_REMOVE.name, TAG_CREATE_EDIT_REMOVE.description, false);

    // ── Edit ────────────────────────────────────────────────────────────────
    await tagsPage.editTagDescription(TAG_CREATE_EDIT_REMOVE.name, TAG_CREATE_EDIT_REMOVE.editedDescription);

    await tagsPage.expectTagInTable(TAG_CREATE_EDIT_REMOVE.name, TAG_CREATE_EDIT_REMOVE.editedDescription);

    // ── Delete ──────────────────────────────────────────────────────────────
    await tagsPage.deleteTag(TAG_CREATE_EDIT_REMOVE.name);

    await tagsPage.expectTagNotInTable(TAG_CREATE_EDIT_REMOVE.name);
  });
});
