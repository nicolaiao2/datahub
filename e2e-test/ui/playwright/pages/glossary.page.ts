/**
 * GlossaryPage — page object for /glossary (Business Glossary).
 *
 * Covers the full CRUD lifecycle for Glossary Term Groups and Glossary Terms,
 * including navigation, creation, moving, deleting, and adding terms to datasets.
 *
 * Key selectors are taken directly from the React source:
 *   - GlossaryContentProvider.tsx   → glossaryPageV2, add-term-group-button-v2
 *   - GlossarySidebar.tsx           → glossary-browser-sidebar, create-glossary-button
 *   - ChildrenTab.tsx               → add-term-button
 *   - EntityTabs.tsx                → ${name}-entity-tab-header
 *   - CreateGlossaryEntityModal.tsx → create-glossary-entity-modal-name, glossary-entity-modal-create-button
 *   - MoveGlossaryEntityModal.tsx   → move-glossary-entity-modal, glossary-entity-modal-move-button
 *   - EntityDropdown.tsx            → MoreVertOutlinedIcon (three-dot), entity-menu-delete-button, entity-menu-move-button
 *   - EntityActions.tsx             → glossary-batch-add
 *   - EntitySearchResults.tsx       → checkbox-{urn} (entity select checkboxes in batch-add modal)
 *   - SearchSelectModal.tsx         → search-select-modal
 *   - EmbeddedListSearch            → search-results-advanced-search, adv-search-add-filter-tags
 */

import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base.page';
import type { DataHubLogger } from '../utils/logger';
import { GraphQLHelper } from '../helpers/graphql-helper';
import { ModalComponent } from './common/modal-component';

export class GlossaryPage extends BasePage {
  readonly modalComponent: ModalComponent;

  // ── Navigation ──────────────────────────────────────────────────────────────
  readonly glossaryPageHeader: Locator;
  readonly sidebarContainer: Locator;

  // ── Root-level create buttons (GlossaryContentProvider header) ──────────────
  readonly addTermGroupButtonV2: Locator;

  // ── Glossary sidebar (GlossarySidebar) ──────────────────────────────────────
  readonly createGlossarySidebarButton: Locator;

  // ── Entity contents tab buttons (ChildrenTab) ────────────────────────────────
  readonly addTermButton: Locator;

  // ── Create modal (CreateGlossaryEntityModal) ─────────────────────────────────
  readonly createModalNameInput: Locator;
  readonly createModalSubmitButton: Locator;

  // ── Move modal (MoveGlossaryEntityModal) ─────────────────────────────────────
  readonly moveModalContainer: Locator;
  readonly moveModalSubmitButton: Locator;

  // ── Three-dot entity menu (EntityDropdown) ────────────────────────────────────
  readonly entityMenuThreeDotButton: Locator;
  readonly entityMenuDeleteButton: Locator;
  readonly entityMenuMoveButton: Locator;

  // ── Batch-add glossary term button (EntityActions) ─────────────────────────
  readonly batchAddGlossaryButton: Locator;

  // ── Batch-add modal entity results (SearchSelectModal / EntitySearchResults) ─
  readonly previewEntities: Locator;
  readonly entityCheckboxes: Locator;
  readonly modalSearchInput: Locator;

  // ── Search input (shared EmbeddedListSearch) ──────────────────────────────
  readonly searchInput: Locator;

  // ── Continue button (entity selection modal) ──────────────────────────────
  readonly continueButton: Locator;

  // ── Related-assets filter icon ────────────────────────────────────────────
  readonly facetFilterIcon: Locator;
  readonly firstFacetTagCheckbox: Locator;

  // ── Advanced search / filter panel ───────────────────────────────────────
  readonly advancedSearchButton: Locator;
  readonly addFilterButton: Locator;
  readonly addFilterTagsButton: Locator;
  readonly filterTagSelectInput: Locator;
  readonly addTagsConfirmButton: Locator;

  private readonly graphqlHelper: GraphQLHelper;

  constructor(page: Page, logger?: DataHubLogger, logDir?: string) {
    super(page, logger, logDir);
    this.graphqlHelper = new GraphQLHelper(page);

    this.modalComponent = new ModalComponent(page);

    this.glossaryPageHeader = page.locator('[data-testid="glossaryPageV2"]');
    this.sidebarContainer = page.locator('[data-testid="glossary-browser-sidebar"]');

    this.addTermGroupButtonV2 = page.locator('[data-testid="add-term-group-button-v2"]').first();
    this.createGlossarySidebarButton = page.locator('[data-testid="create-glossary-button"]');

    this.addTermButton = page.locator('[data-testid="add-term-button"]').first();

    this.createModalNameInput = page.locator('[data-testid="create-glossary-entity-modal-name"] input');
    this.createModalSubmitButton = page.locator('[data-testid="glossary-entity-modal-create-button"]');

    // The AntD modal root is a wrapper; target the inner visible dialog content.
    this.moveModalContainer = page.locator('[data-testid="move-glossary-entity-modal"] .ant-modal-content');
    this.moveModalSubmitButton = page.locator('[data-testid="glossary-entity-modal-move-button"]');

    // MoreVertOutlinedIcon is the data-testid set by EntityDropdown.tsx on the three-dot icon button.
    this.entityMenuThreeDotButton = page.locator('[data-testid="MoreVertOutlinedIcon"]').first();
    this.entityMenuDeleteButton = page.locator('[data-testid="entity-menu-delete-button"]');
    this.entityMenuMoveButton = page.locator('[data-testid="entity-menu-move-button"]');

    this.batchAddGlossaryButton = page.locator('[data-testid="glossary-batch-add"]').first();

    // preview-urn: prefix is set by entity preview cards; checkbox- prefix by entity select checkboxes.
    this.previewEntities = page.locator('[data-testid^="preview-urn:"]');
    this.entityCheckboxes = page.locator('[data-testid^="checkbox-"]');
    this.modalSearchInput = page.locator('[data-testid="search-select-modal"] [data-testid="search-input"]');

    this.searchInput = page.locator('[data-testid="search-input"]').last();

    this.continueButton = page.locator('#continueButton');
    this.facetFilterIcon = page.locator('.anticon-filter').first();
    this.firstFacetTagCheckbox = page
      .locator('input.ant-checkbox-input[data-testid^="facet-tags-urn:li:tag:"]')
      .first();
    this.advancedSearchButton = page.locator('#search-results-advanced-search');
    this.addFilterButton = page.getByText('Add Filter');
    this.addFilterTagsButton = page.getByTestId('adv-search-add-filter-tags');
    this.filterTagSelectInput = page.locator('div.ant-select-selection-overflow input');
    this.addTagsConfirmButton = page.locator('[data-testid="add-tag-term-from-modal-btn"]');
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  async navigateToGlossary(): Promise<void> {
    this.logger?.step('navigate', { url: '/glossary' });
    await this.page.goto('/glossary');
    await this.waitForPageLoad();
    await expect(this.sidebarContainer).toBeVisible();
  }

  async navigateToGlossaryTermByUrn(urn: string): Promise<void> {
    this.logger?.step('navigateToGlossaryTermByUrn', { urn });
    await this.page.goto(`/glossaryTerm/${encodeURIComponent(urn)}`);
    await this.waitForPageLoad();
  }

  async navigateToGlossaryTerm(text: string): Promise<void> {
    // Prefer clicking a visible link or text rather than a hidden sidebar span.
    // Filter to only the visible match so we don't hit hidden sidebar browser entries.
    const visibleElement = this.page.getByText(text).filter({ visible: true }).first();
    await visibleElement.waitFor({ state: 'visible' });
    await visibleElement.click();
    await this.waitForPageLoad();
  }

  async navigateToEntityContentsTab(): Promise<void> {
    await this.clickEntityTabByName('Contents');
  }

  async navigateToEntityPropertiesTab(): Promise<void> {
    await this.clickEntityTabByName('Properties');
  }

  async navigateToEntityRelatedAssetsTab(): Promise<void> {
    await this.clickEntityTabByName('Related Assets');
  }

  getEntityTabLocator(tabName: string): Locator {
    return this.page.locator(`[data-testid="${tabName}-entity-tab-header"]`);
  }

  async clickEntityTabByName(tabName: string): Promise<void> {
    await this.getEntityTabLocator(tabName).click();
    await this.waitForPageLoad();
  }

  // ── Glossary Term Group CRUD ─────────────────────────────────────────────────
  /**
   * Creates a root-level Term Group from the glossary home page header button.
   * Returns the URN of the created term group from the GraphQL response.
   */
  async createTermGroup(name: string): Promise<string> {
    this.logger?.step('createTermGroup', { name });
    await this.addTermGroupButtonV2.click();
    // Wait for the modal heading (h1 role) specifically to avoid matching the button text.
    await expect(this.page.getByRole('heading', { name: 'Create Glossary' })).toBeVisible();
    await this.createModalNameInput.fill(name);
    const responsePromise = this.graphqlHelper.waitForGraphQLResponse('createGlossaryNode');
    await this.createModalSubmitButton.click();
    await expect(this.page.getByText(`Created Term Group!`)).toBeVisible();
    const response = await responsePromise;
    return (response.data as Record<string, string>).createGlossaryNode;
  }

  /**
   * Creates a Glossary Term inside the currently-open entity (term group) page.
   * Requires the Contents tab to already be active.
   * Returns the URN of the created term from the GraphQL response.
   */
  async createTermInContentsTab(name: string): Promise<string> {
    this.logger?.step('createTermInContentsTab', { name });
    await this.addTermButton.click();
    await expect(this.page.getByRole('heading', { name: 'Create Glossary Term' })).toBeVisible();
    await this.createModalNameInput.fill(name);
    const responsePromise = this.graphqlHelper.waitForGraphQLResponse('createGlossaryTerm');
    await this.createModalSubmitButton.click();
    const createdToast = this.page.getByText('Created Glossary Term!');
    await expect(createdToast).toBeVisible();
    await expect(createdToast).toBeHidden();
    const response = await responsePromise;
    return (response.data as Record<string, string>).createGlossaryTerm;
  }

  // ── Three-dot entity menu actions ────────────────────────────────────────────

  /** Opens the three-dot dropdown for the currently-viewed entity. */
  async openEntityMenu(): Promise<void> {
    await this.entityMenuThreeDotButton.click();
  }

  /** Deletes the currently-viewed entity via the three-dot menu. */
  async deleteCurrentEntity(): Promise<void> {
    this.logger?.step('deleteCurrentEntity');
    await this.openEntityMenu();
    await this.entityMenuDeleteButton.click();
    await this.page.getByRole('button', { name: 'Yes' }).click();
    await expect(this.page.getByText(/Deleted .+!/)).toBeVisible();
  }

  /**
   * Moves the currently-viewed entity to a target parent using the three-dot menu.
   * @param targetName - Display name of the target group shown in the move modal tree.
   */
  async moveCurrentEntityTo(targetName: string): Promise<void> {
    this.logger?.step('moveCurrentEntityTo', { targetName });
    await this.openEntityMenu();
    // Use the entity-menu-move-button testid to avoid matching hidden DnD accessibility elements.
    await this.entityMenuMoveButton.click();
    await expect(this.moveModalContainer).toBeVisible();
    // Type into the AntD Select search input to filter results — more reliable than
    // scrolling through the GlossaryBrowser tree which accumulates entries across test runs.
    const selectInput = this.moveModalContainer.locator('.ant-select-selector input');
    await selectInput.click();
    await selectInput.fill(targetName);
    // The dropdown shows search results (not the tree browser) when a query is present.
    const option = this.page.locator('.ant-select-dropdown').getByText(targetName, { exact: true }).first();
    await expect(option).toBeVisible();
    await option.click();
    await this.moveModalSubmitButton.click({ force: true });
    await expect(this.page.getByText(/Moved .+!/)).toBeVisible();
  }

  // ── Batch add term to entities ───────────────────────────────────────────────

  /**
   * Uses the "Add Assets" batch button on a glossary term entity page to assign
   * the term to one or more datasets via the search modal.
   */
  async batchAddToFirstResult(): Promise<void> {
    this.logger?.step('batchAddToFirstResult');
    await this.batchAddGlossaryButton.click();
    await expect(this.previewEntities.first()).toBeVisible();
    await this.entityCheckboxes.first().click();
    await this.continueButton.click();
    await expect(this.page.getByText('Added Glossary Term to entities!')).toBeVisible();
  }

  /**
   * Uses the "Add Assets" batch button to assign the term to a specific entity found by search query.
   * Searches within the modal for the entity by name, waits for it to appear, then confirms.
   */
  getPreviewEntityTitleByText(text: string): Locator {
    return this.previewEntities.locator('[data-testid="entity-title"]').filter({ hasText: text }).first();
  }

  async getFirstPreviewEntityTitle(): Promise<string> {
    return this.previewEntities.locator('[data-testid="entity-title"]').first().innerText();
  }

  async batchAddToEntityBySearch(query: string): Promise<void> {
    this.logger?.step('batchAddToEntityBySearch', { query });
    await this.batchAddGlossaryButton.click();
    await expect(this.modalSearchInput).toBeVisible();
    // pressSequentially triggers the debounced search handler character by character.
    await this.modalSearchInput.pressSequentially(query, { delay: 50 });
    await expect(this.getPreviewEntityTitleByText(query)).toBeVisible();
    await this.entityCheckboxes.first().click();
    await this.continueButton.click();
    await expect(this.page.getByText('Added Glossary Term to entities!')).toBeVisible();
  }

  // ── Search within an entity page ─────────────────────────────────────────────

  async searchWithinEntityPage(query: string): Promise<void> {
    this.logger?.step('searchWithinEntityPage', { query });
    await this.searchInput.click();
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.waitForPageLoad();
  }

  // ── Sidebar navigation ───────────────────────────────────────────────────────

  /** Clicks an item by name in the glossary browser sidebar. */
  async clickSidebarItem(name: string): Promise<void> {
    await this.sidebarContainer.getByText(name).click();
    await this.waitForPageLoad();
  }

  // ── Related-assets filtering ─────────────────────────────────────────────────

  /**
   * Opens the basic facet filter panel on the Related Assets / search-results panel.
   * .anticon-filter is the AntD CSS class applied to the filter icon button; no data-testid exists.
   */
  async clickFacetFilterIcon(): Promise<void> {
    await this.facetFilterIcon.click();
  }

  /**
   * Opens the basic facet filter panel and clicks the checkbox for a specific tag.
   * The facet checkbox data-testid is `facet-tags-{tagUrn}`.
   */
  async applyFacetTagFilter(tagUrn: string): Promise<void> {
    this.logger?.step('applyFacetTagFilter', { tagUrn });
    await this.facetFilterIcon.click();
    await this.page.locator(`input.ant-checkbox-input[data-testid="facet-tags-${tagUrn}"]`).click();
  }

  /**
   * Applies an advanced-search tag filter on the Related Assets panel.
   * Navigates: filter icon → Advanced → Add Filter → Tags → selects tag → confirms.
   */
  getTagFilterOption(tagName: string): Locator {
    return this.page.locator(`[data-testid="tag-term-option-${tagName}"]`);
  }

  async filterRelatedAssetsByTag(tagName: string): Promise<void> {
    this.logger?.step('filterRelatedAssetsByTag', { tagName });
    await this.facetFilterIcon.click();
    await this.advancedSearchButton.click();
    await this.addFilterButton.click();
    await this.addFilterTagsButton.click();
    // AntD Select: type into the overflow input to trigger the options search.
    await this.filterTagSelectInput.pressSequentially(tagName);
    await this.getTagFilterOption(tagName).click();
    await this.modalComponent.title.click();
    await this.addTagsConfirmButton.click();
  }

  // ── Assertions ───────────────────────────────────────────────────────────────

  /**
   * Asserts the Properties tab is the currently selected tab.
   * Uses role="tab" ARIA selector instead of AntD-internal [data-node-key] + .ant-tabs-tab-btn.
   */
  async expectPropertiesTabActive(): Promise<void> {
    await expect(this.page.getByRole('tab', { name: 'Properties' }).first()).toHaveAttribute('aria-selected', 'true');
  }

  async expectTextVisible(text: string): Promise<void> {
    await expect(this.page.getByText(text).filter({ visible: true }).first()).toBeVisible();
  }

  async expectTextNotPresent(text: string): Promise<void> {
    await expect(this.page.getByText(text).first()).toBeHidden();
  }

  async expectSidebarContains(name: string): Promise<void> {
    await expect(this.sidebarContainer.getByText(name)).toBeVisible();
  }

  async expectSidebarNotContains(name: string): Promise<void> {
    await expect(this.sidebarContainer.getByText(name)).toBeHidden();
  }

  async expectPreviewEntitiesVisible(): Promise<void> {
    await expect(this.previewEntities.first()).toBeVisible();
  }

  /**
   * Asserts that a specific entity preview card is visible, matched by URN.
   * Uses .or() to tolerate both the exact `preview-{urn}` testid and a
   * `preview-{urn}` prefix match (some entity types append a sub-path).
   */
  async expectPreviewEntityByUrn(urn: string): Promise<void> {
    const exact = this.page.locator(`[data-testid="preview-${urn}"]`);
    const prefix = this.page.locator(`[data-testid^="preview-${urn}"]`);
    await expect(exact.or(prefix).first()).toBeVisible();
  }
}
