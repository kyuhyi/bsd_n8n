import { chromium, Browser, Page } from 'playwright';

export class PlaywrightService {
  private browser: Browser | null = null;
  private page: Page | null = null;

  /**
   * Initialize browser
   */
  async init(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox']
      });
    }

    if (!this.page) {
      this.page = await this.browser.newPage();
    }
  }

  /**
   * Navigate to n8n workflow editor
   */
  async navigateToWorkflow(n8nUrl: string, workflowId: string): Promise<void> {
    await this.ensureInitialized();

    const url = `${n8nUrl}/workflow/${workflowId}`;
    await this.page!.goto(url, { waitUntil: 'networkidle' });
  }

  /**
   * Capture screenshot of workflow
   */
  async captureWorkflowScreenshot(): Promise<string> {
    await this.ensureInitialized();

    const screenshot = await this.page!.screenshot({
      type: 'png',
      fullPage: true
    });

    return screenshot.toString('base64');
  }

  /**
   * Capture screenshot of specific node
   */
  async captureNodeScreenshot(nodeName: string): Promise<string> {
    await this.ensureInitialized();

    // Find the node element (this selector may need adjustment based on n8n version)
    const nodeElement = await this.page!.locator(`[data-name="${nodeName}"]`).first();

    if (!nodeElement) {
      throw new Error(`Node "${nodeName}" not found`);
    }

    const screenshot = await nodeElement.screenshot({ type: 'png' });
    return screenshot.toString('base64');
  }

  /**
   * Check if workflow has errors (visual detection)
   */
  async detectErrors(): Promise<{
    hasErrors: boolean;
    errorNodes: string[];
  }> {
    await this.ensureInitialized();

    // Look for error indicators (red highlights, error icons, etc.)
    // This is a simplified implementation
    const errorElements = await this.page!.locator('.has-issues, .node-error, [data-test-id*="error"]').all();

    const errorNodes: string[] = [];

    for (const element of errorElements) {
      const nodeName = await element.getAttribute('data-name') || 'unknown';
      errorNodes.push(nodeName);
    }

    return {
      hasErrors: errorNodes.length > 0,
      errorNodes
    };
  }

  /**
   * Monitor workflow execution in real-time
   */
  async monitorExecution(
    onProgress: (status: {
      currentNode: string;
      status: 'running' | 'success' | 'error';
    }) => void
  ): Promise<void> {
    await this.ensureInitialized();

    // Listen for execution updates
    // This is a simplified implementation - actual implementation would depend on n8n UI structure
    await this.page!.on('console', msg => {
      const text = msg.text();
      if (text.includes('execution')) {
        // Parse and emit progress updates
        onProgress({
          currentNode: 'detecting...',
          status: 'running'
        });
      }
    });
  }

  /**
   * Click execute workflow button
   */
  async executeWorkflow(): Promise<void> {
    await this.ensureInitialized();

    // Find and click execute button
    const executeButton = this.page!.locator('[data-test-id="execute-workflow-button"]').first();
    await executeButton.click();

    // Wait for execution to complete
    await this.page!.waitForTimeout(2000);
  }

  /**
   * Get workflow canvas state
   */
  async getCanvasState(): Promise<{
    nodes: Array<{ name: string; position: { x: number; y: number }; hasError: boolean }>;
    connections: number;
  }> {
    await this.ensureInitialized();

    // Extract node information from canvas
    const nodes = await this.page!.evaluate(() => {
      const nodeElements = document.querySelectorAll('[data-node-name]');
      return Array.from(nodeElements).map(el => ({
        name: el.getAttribute('data-node-name') || '',
        position: {
          x: parseInt(el.getAttribute('data-position-x') || '0'),
          y: parseInt(el.getAttribute('data-position-y') || '0')
        },
        hasError: el.classList.contains('has-issues')
      }));
    });

    const connections = await this.page!.evaluate(() => {
      return document.querySelectorAll('.connection').length;
    });

    return {
      nodes,
      connections
    };
  }

  /**
   * Wait for workflow execution to complete
   */
  async waitForExecutionComplete(timeout: number = 30000): Promise<{
    success: boolean;
    duration: number;
  }> {
    await this.ensureInitialized();

    const startTime = Date.now();

    // Wait for execution indicator to disappear or error to appear
    try {
      await this.page!.waitForSelector('.execution-complete, .execution-error', {
        timeout
      });

      const hasError = await this.page!.locator('.execution-error').count() > 0;

      return {
        success: !hasError,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Extract error message from UI
   */
  async getErrorMessage(): Promise<string | null> {
    await this.ensureInitialized();

    const errorElement = this.page!.locator('.error-message, .node-error-message').first();

    if (await errorElement.count() > 0) {
      return await errorElement.textContent();
    }

    return null;
  }

  /**
   * Take periodic screenshots for monitoring
   */
  async startPeriodicCapture(
    intervalMs: number,
    onCapture: (screenshot: string) => void
  ): Promise<() => void> {
    await this.ensureInitialized();

    const interval = setInterval(async () => {
      const screenshot = await this.captureWorkflowScreenshot();
      onCapture(screenshot);
    }, intervalMs);

    // Return cleanup function
    return () => clearInterval(interval);
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Ensure browser is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.browser || !this.page) {
      await this.init();
    }
  }

  /**
   * Get page instance (for advanced operations)
   */
  getPage(): Page | null {
    return this.page;
  }
}

// Singleton instance
export const playwrightService = new PlaywrightService();
