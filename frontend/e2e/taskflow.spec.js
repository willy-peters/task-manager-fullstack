import { expect, test } from '@playwright/test';

const SCREENSHOT_DIR = 'e2e/screenshots';

test.describe('TaskFlow E2E & Responsive QA (Live Render API)', () => {
  test('full auth, CRUD, search/filter, persistence, and responsive layout across Desktop, Tablet & Mobile', async ({
    page,
  }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const uniqueId = Date.now();
    const testUser = {
      name: 'Playwright QA',
      email: `qa-${uniqueId}@example.com`,
      password: 'Password123!',
    };

    // 1. Desktop (1440x900) — Protected route redirect & Register
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /sign in to your account/i })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-login-desktop.png`, fullPage: true });

    await page.getByRole('link', { name: /register/i }).click();
    await expect(page).toHaveURL(/\/register$/);
    await page.getByLabel(/full name/i).fill(testUser.name);
    await page.getByLabel(/^email$/i).fill(testUser.email);
    await page.getByLabel(/^password$/i).fill(testUser.password);
    await page.getByLabel(/^confirm password$/i).fill(testUser.password);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-register-desktop.png`, fullPage: true });

    await page.getByRole('button', { name: /create account/i }).click();

    // Render free-tier cold start may take 30-60s on first call
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 75000 });
    await expect(page.getByRole('heading', { name: /overview & tasks/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /no tasks yet/i })).toBeVisible();

    // Verify no horizontal overflow on Desktop
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);

    // 2. Create 3 tasks (pending, in-progress, completed)
    const tasksToCreate = [
      {
        title: 'Database Migration to Aurora',
        description: 'Migrate read-replicas to serverless v2.',
        status: 'Pending',
      },
      {
        title: 'Revamp Authentication Flows',
        description: 'Add JWT refresh rotation.',
        status: 'In Progress',
      },
      {
        title: 'Security Audit Remediation',
        description: 'Update CORS whitelist policies.',
        status: 'Completed',
      },
    ];

    for (const item of tasksToCreate) {
      await page.getByRole('button', { name: /^add task$/i }).first().click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await dialog.getByLabel(/task title/i).fill(item.title);
      await dialog.getByLabel(/description/i).fill(item.description);
      await dialog.locator('label', { hasText: item.status }).click();
      await dialog.getByRole('button', { name: /create task/i }).click();
      await expect(dialog).toBeHidden();
      await expect(page.getByText(item.title)).toBeVisible();
    }

    // Verify KPI Metrics: Total 3, Active 2, Completed 1 (no rate percentage)
    const stats = page.getByLabel('Task metrics');
    await expect(stats).toContainText('3');
    await expect(stats).toContainText('2');
    await expect(stats).toContainText('1');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-dashboard-desktop.png`, fullPage: true });

    // 3. Real-time Search, Status Tabs, Filtered Zero-State & Clear
    await page.getByLabel(/search tasks/i).fill('aurora');
    await expect(page.getByText('Database Migration to Aurora')).toBeVisible();
    await expect(page.getByText('Revamp Authentication Flows')).toBeHidden();

    await page.getByLabel(/search tasks/i).fill('definitely-not-found');
    await expect(page.getByRole('heading', { name: /no tasks match your filters/i })).toBeVisible();
    await page.getByRole('button', { name: /^clear filters$/i }).first().click();
    await expect(page.getByText('Revamp Authentication Flows')).toBeVisible();

    // Status tab filter
    await page.getByRole('tab', { name: /in progress \(1\)/i }).click();
    await expect(page.getByText('Revamp Authentication Flows')).toBeVisible();
    await expect(page.getByText('Database Migration to Aurora')).toBeHidden();
    await page.getByRole('tab', { name: /all \(3\)/i }).click();

    // 4. Edit task & verify persistence after reload
    await page.getByRole('button', { name: /edit "database migration to aurora"/i }).click();
    const editDialog = page.getByRole('dialog');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04-edit-modal-desktop.png` });
    await editDialog.getByLabel(/task title/i).fill('Aurora v2 Migration Done');
    await editDialog.getByRole('button', { name: /save changes/i }).click();
    await expect(editDialog).toBeHidden();
    await expect(page.getByText('Aurora v2 Migration Done')).toBeVisible();

    await page.reload();
    await expect(page.getByText('Aurora v2 Migration Done')).toBeVisible();

    // 5. Tablet Viewport (768x1024)
    await page.setViewportSize({ width: 768, height: 1024 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-dashboard-tablet.png`, fullPage: true });

    // 6. Mobile Viewport (375x812) — layout, bottom sheet modal, 44px touch targets
    await page.setViewportSize({ width: 375, height: 812 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);

    // Sticky FAB visible and >= 44px height
    const fab = page.getByRole('button', { name: /create new task/i });
    await expect(fab).toBeVisible();
    const fabBox = await fab.boundingBox();
    expect(fabBox.height).toBeGreaterThanOrEqual(44);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-dashboard-mobile.png`, fullPage: true });

    // Open mobile bottom sheet modal
    await fab.click();
    const mobileDialog = page.getByRole('dialog');
    await expect(mobileDialog).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-modal-mobile.png` });
    await mobileDialog.getByRole('button', { name: /cancel/i }).click();
    await expect(mobileDialog).toBeHidden();

    // 7. Delete a task on Desktop & Logout / Re-login
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('button', { name: /delete "aurora v2 migration done"/i }).click();
    await page.getByRole('dialog').getByRole('button', { name: /delete task/i }).click();
    await expect(page.getByRole('heading', { name: 'Aurora v2 Migration Done' })).toBeHidden();

    // Logout
    await page.getByRole('button', { name: /logout/i }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Logged out successfully')).toBeVisible();

    // Re-login with created user
    await page.getByLabel(/email address/i).fill(testUser.email);
    await page.getByLabel(/^password$/i).fill(testUser.password);
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(`Welcome back, ${testUser.name}`)).toBeVisible();
    await expect(page.getByText('Revamp Authentication Flows')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});
