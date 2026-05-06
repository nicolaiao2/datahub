import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './base.page';
import type { DataHubLogger } from '../utils/logger';

/**
 * Page object for the Manage Tags page (/tags).
 *
 * Covers all CRUD operations on the tags list page as well as
 * the create / edit modals.
 */
export class TagsPage extends BasePage {
  // ── Top-level page elements ──────────────────────────────────────────────

  readonly createTagButton: Locator;
  readonly searchInput: Locator;

  // ── Create-tag modal elements ────────────────────────────────────────────

  // AntD modals render their content in a portal appended to document.body.
  // The .ant-modal-wrap is the container that has display:none when closed,
  // so we use it as the visibility anchor.
  // The data-testid attributes (tag-name-field, tag-description-field) may
  // also appear on the edit modal, so we scope by the unique button test IDs.
  readonly createTagModalContent: Locator;
  readonly createTagNameInput: Locator;
  readonly createTagDescriptionInput: Locator;
  readonly createTagCreateButton: Locator;
  readonly createTagCancelButton: Locator;

  // ── Edit-tag modal elements ──────────────────────────────────────────────

  readonly editTagModalContent: Locator;
  readonly editTagDescriptionInput: Locator;
  readonly editTagSaveButton: Locator;

  // ── Delete-tag modal elements ────────────────────────────────────────────

  readonly deleteTagConfirmButton: Locator;

  constructor(page: Page, logger?: DataHubLogger, logDir?: string) {
    super(page, logger, logDir);

    this.createTagButton = page.locator('[data-testid="add-tag-button"]');
    this.searchInput = page.locator('[data-testid="tag-search-input"]');

    // Unique button test IDs let us scope to the correct modal even when both
    // modals are mounted in the same portal.
    // The alchemy Input component renders as a styled <input> with data-testid
    // on the wrapper div, so we drill into the <input> child.
    this.createTagCreateButton = page.locator('[data-testid="create-tag-modal-create-button"]');
    this.createTagCancelButton = page.locator('[data-testid="create-tag-modal-cancel-button"]');
    // Scope inputs/modal content to the .ant-modal-wrap that contains the create button.
    // We use the :has() pseudo-class to find the wrap containing our unique button.
    this.createTagModalContent = page.locator(
      '.ant-modal-wrap:has([data-testid="create-tag-modal-create-button"]) .ant-modal-content',
    );
    this.createTagNameInput = page
      .locator('.ant-modal-wrap:has([data-testid="create-tag-modal-create-button"]) [data-testid="tag-name-field"]')
      .locator('input');
    this.createTagDescriptionInput = page
      .locator(
        '.ant-modal-wrap:has([data-testid="create-tag-modal-create-button"]) [data-testid="tag-description-field"]',
      )
      .locator('input');

    this.editTagSaveButton = page.locator('[data-testid="update-tag-button"]');
    this.editTagModalContent = page.locator(
      '.ant-modal-wrap:has([data-testid="update-tag-button"]) .ant-modal-content',
    );
    this.editTagDescriptionInput = page
      .locator('.ant-modal-wrap:has([data-testid="update-tag-button"]) [data-testid="tag-description-field"]')
      .locator('input');

    this.deleteTagConfirmButton = page.locator('[data-testid="delete-tag-button"]');
  }

  // ── Navigation ───────────────────────────────────────────────────────────

  async navigate(): Promise<void> {
    await this.page.goto('/tags');
    await this.waitForPageLoad();
  }

  // ── Tag URN helper ───────────────────────────────────────────────────────

  getTagUrn(name: string): string {
    return `urn:li:tag:${name}`;
  }

  // ── Search helpers ───────────────────────────────────────────────────────

  async searchForTag(name: string): Promise<void> {
    // Use fill rather than type to avoid Cypress-style "delay" hacks
    await this.searchInput.fill(name);
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.fill('');
  }

  // ── Create tag ───────────────────────────────────────────────────────────

  /**
   * Open the Create Tag modal, fill in the name and description, then
   * submit the form.
   *
   * @param expectSuccess When true (default), waits for the modal to close
   *   confirming creation succeeded.  Pass false to verify that a duplicate
   *   name is rejected and then dismiss the modal.
   */
  async createTag(name: string, description: string, expectSuccess = true): Promise<void> {
    await expect(this.createTagButton).toBeVisible();
    await this.createTagButton.click();

    await expect(this.createTagModalContent).toBeVisible({ timeout: 10000 });

    await this.createTagNameInput.fill(name);
    await this.createTagDescriptionInput.fill(description);

    await this.createTagCreateButton.click();

    if (expectSuccess) {
      // Modal closes when creation succeeds; the "Create Tag" button returns to focus
      await expect(this.createTagModalContent).toBeHidden({ timeout: 15000 });
      await expect(this.createTagButton).toBeVisible();
    } else {
      // Duplicate-name attempt: an error message should be visible
      await expect(this.page.getByText(/Failed to create tag/)).toBeVisible({ timeout: 10000 });
      // Dismiss the modal
      await this.createTagCancelButton.click();
      await expect(this.createTagModalContent).toBeHidden({ timeout: 10000 });
    }
  }

  // ── Edit tag ─────────────────────────────────────────────────────────────

  /**
   * Open the actions menu for the given tag, choose Edit, update the
   * description, and save.
   *
   * Uses the same retry pattern as deleteTag to guard against the AntD dropdown
   * closing and detaching the menu item before the click lands.
   */
  async editTagDescription(name: string, newDescription: string): Promise<void> {
    await this.searchForTag(name);

    const tagUrn = this.getTagUrn(name);
    const actionsButton = this.page.locator(`[data-testid="${tagUrn}-actions"]`);
    const actionEdit = this.page.locator('[data-testid="action-edit"]');

    const maxMenuAttempts = 3;
    for (let attempt = 0; attempt < maxMenuAttempts; attempt++) {
      await expect(actionsButton).toBeVisible({ timeout: 10000 });
      await actionsButton.click();
      try {
        await actionEdit.waitFor({ state: 'visible', timeout: 5000 });
        await actionEdit.click();
        break;
      } catch {
        if (attempt === maxMenuAttempts - 1)
          throw new Error(`Could not click action-edit after ${maxMenuAttempts} attempts`);
      }
    }

    await expect(this.editTagModalContent).toBeVisible({ timeout: 10000 });

    await this.editTagDescriptionInput.fill(newDescription);
    await this.editTagSaveButton.click();

    await expect(this.editTagModalContent).toBeHidden({ timeout: 15000 });
    await this.clearSearch();
  }

  // ── Delete tag ───────────────────────────────────────────────────────────

  /**
   * Open the actions menu for the given tag, choose Delete, and confirm.
   *
   * The AntD dropdown mounts its items dynamically and can unmount them before
   * the click is registered if the menu closes due to a focus change or re-render.
   * We retry the open→click sequence up to three times to handle that race.
   */
  async deleteTag(name: string): Promise<void> {
    await this.searchForTag(name);

    const tagUrn = this.getTagUrn(name);
    const actionsButton = this.page.locator(`[data-testid="${tagUrn}-actions"]`);
    const actionDelete = this.page.locator('[data-testid="action-delete"]');

    // Retry opening the dropdown and clicking the delete item in case the menu
    // closes and detaches the item before the click lands.
    const maxMenuAttempts = 3;
    for (let attempt = 0; attempt < maxMenuAttempts; attempt++) {
      await expect(actionsButton).toBeVisible({ timeout: 10000 });
      await actionsButton.click();
      try {
        await actionDelete.waitFor({ state: 'visible', timeout: 5000 });
        await actionDelete.click();
        break;
      } catch {
        // Menu closed before we could click — re-open on next iteration
        if (attempt === maxMenuAttempts - 1)
          throw new Error(`Could not click action-delete after ${maxMenuAttempts} attempts`);
      }
    }

    await expect(this.deleteTagConfirmButton).toBeVisible({ timeout: 10000 });
    await this.deleteTagConfirmButton.click();

    // Wait for the delete confirmation modal to close
    await expect(this.page.locator('[data-testid="delete-tag-button"]')).toBeHidden({ timeout: 10000 });
    await this.clearSearch();
  }

  // ── Assertions ───────────────────────────────────────────────────────────

  async expectTagInTable(name: string, description: string): Promise<void> {
    await this.searchForTag(name);
    const tagUrn = this.getTagUrn(name);
    await expect(this.page.locator(`[data-testid="${tagUrn}-name"]`)).toContainText(name);
    await expect(this.page.locator(`[data-testid="${tagUrn}-description"]`)).toContainText(description);
    await this.clearSearch();
  }

  async expectTagNotInTable(name: string): Promise<void> {
    await this.searchForTag(name);
    const tagUrn = this.getTagUrn(name);
    await expect(this.page.locator(`[data-testid="${tagUrn}-name"]`)).toBeHidden({ timeout: 10000 });
    await this.clearSearch();
  }
}
