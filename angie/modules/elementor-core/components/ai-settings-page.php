<?php

namespace Angie\Modules\ElementorCore\Components;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * AI Settings Page
 *
 * Admin page for configuring OpenAI API settings
 */
class AI_Settings_Page {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'admin_menu', [ $this, 'add_menu_page' ], 20 );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts' ] );
	}

	/**
	 * Add submenu page under Angie
	 */
	public function add_menu_page() {
		add_submenu_page(
			'angie-app',
			__( 'AI Settings', 'angie' ),
			__( 'AI Settings', 'angie' ),
			'manage_options',
			'angie-ai-settings',
			[ $this, 'render_page' ],
			30
		);
	}

	/**
	 * Enqueue scripts and styles
	 *
	 * @param string $hook
	 */
	public function enqueue_scripts( $hook ) {
		if ( $hook !== 'angie_page_angie-ai-settings' ) {
			return;
		}

		wp_enqueue_style(
			'angie-ai-settings',
			ANGIE_URL . 'modules/elementor-core/assets/css/ai-settings.css',
			[],
			ANGIE_VERSION
		);

		wp_enqueue_script(
			'angie-ai-settings',
			ANGIE_URL . 'modules/elementor-core/assets/js/ai-settings.js',
			[ 'jquery', 'wp-api-request' ],
			ANGIE_VERSION,
			true
		);

		wp_localize_script(
			'angie-ai-settings',
			'angieAiSettings',
			[
				'restUrl'   => rest_url( 'angie/v1/' ),
				'nonce'     => wp_create_nonce( 'wp_rest' ),
				'i18n'      => [
					'save'              => __( 'Save Settings', 'angie' ),
					'saved'             => __( 'Settings Saved!', 'angie' ),
					'test'              => __( 'Test Connection', 'angie' ),
					'testing'           => __( 'Testing...', 'angie' ),
					'testSuccess'       => __( 'Connection Successful!', 'angie' ),
					'testFailed'        => __( 'Connection Failed', 'angie' ),
					'saveFailed'        => __( 'Failed to save settings', 'angie' ),
					'apiKeyRequired'    => __( 'API Key is required', 'angie' ),
					'endpointRequired'  => __( 'Endpoint URL is required', 'angie' ),
				],
			]
		);
	}

	/**
	 * Render settings page
	 */
	public function render_page() {
		?>
		<div class="wrap angie-ai-settings-wrap">
			<h1><?php esc_html_e( 'AI Settings - OpenAI Configuration', 'angie' ); ?></h1>
			<p class="description">
				<?php esc_html_e( 'Configure your OpenAI API settings for HTML to Elementor conversion.', 'angie' ); ?>
			</p>

			<div id="angie-ai-settings-container">
				<!-- Loading state -->
				<div id="loading-indicator" style="display: none;">
					<p><?php esc_html_e( 'Loading settings...', 'angie' ); ?></p>
				</div>

				<!-- Settings form -->
				<form id="angie-ai-settings-form">
					<table class="form-table" role="presentation">
						<tbody>
							<!-- API Key -->
							<tr>
								<th scope="row">
									<label for="api_key"><?php esc_html_e( 'OpenAI API Key', 'angie' ); ?> <span class="required">*</span></label>
								</th>
								<td>
									<input 
										type="password" 
										id="api_key" 
										name="api_key" 
										class="regular-text" 
										placeholder="sk-..."
										autocomplete="off"
									>
									<p class="description">
										<?php 
										printf(
											/* translators: %s: OpenAI API keys URL */
											esc_html__( 'Get your API key from %s', 'angie' ),
											'<a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Dashboard</a>'
										);
										?>
									</p>
									<p id="api-key-status" class="description" style="display: none;"></p>
								</td>
							</tr>

							<!-- Endpoint URL -->
							<tr>
								<th scope="row">
									<label for="endpoint"><?php esc_html_e( 'API Endpoint URL', 'angie' ); ?> <span class="required">*</span></label>
								</th>
								<td>
									<input 
										type="url" 
										id="endpoint" 
										name="endpoint" 
										class="regular-text" 
										placeholder="https://api.openai.com/v1"
										value="https://api.openai.com/v1"
									>
									<p class="description">
										<?php esc_html_e( 'Use https://api.openai.com/v1 for OpenAI, or your custom OpenAI-compatible endpoint', 'angie' ); ?>
									</p>
								</td>
							</tr>

							<!-- Model -->
							<tr>
								<th scope="row">
									<label for="model"><?php esc_html_e( 'Model', 'angie' ); ?></label>
								</th>
								<td>
									<select id="model" name="model" class="regular-text">
										<option value="gpt-4">GPT-4</option>
										<option value="gpt-4-turbo">GPT-4 Turbo</option>
										<option value="gpt-4o">GPT-4o</option>
										<option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
										<option value="custom">Custom Model Name</option>
									</select>
									<p class="description">
										<?php esc_html_e( 'Select the AI model to use. GPT-4 recommended for best results.', 'angie' ); ?>
									</p>
									
									<!-- Custom Model Name Input (hidden by default) -->
									<div id="custom-model-wrapper" style="display: none; margin-top: 10px;">
										<input 
											type="text" 
											id="custom_model" 
											name="custom_model" 
											class="regular-text" 
											placeholder="e.g., llama2, mistral, your-deployment-name"
										>
										<p class="description">
											<?php esc_html_e( 'Enter custom model name (for LocalAI, Ollama, Azure, etc.)', 'angie' ); ?>
										</p>
									</div>
								</td>
							</tr>

							<!-- Temperature -->
							<tr>
								<th scope="row">
									<label for="temperature"><?php esc_html_e( 'Temperature', 'angie' ); ?></label>
								</th>
								<td>
									<input 
										type="number" 
										id="temperature" 
										name="temperature" 
										class="small-text" 
										min="0" 
										max="2" 
										step="0.1" 
										value="0.7"
									>
									<p class="description">
										<?php esc_html_e( 'Controls randomness (0-2). Lower = more focused, higher = more creative. Default: 0.7', 'angie' ); ?>
									</p>
								</td>
							</tr>
						</tbody>
					</table>

					<p class="submit">
						<button type="button" id="test-connection-btn" class="button button-secondary">
							<?php esc_html_e( 'Test Connection', 'angie' ); ?>
						</button>
						<button type="submit" id="save-settings-btn" class="button button-primary">
							<?php esc_html_e( 'Save Settings', 'angie' ); ?>
						</button>
					</p>

					<!-- Status messages -->
					<div id="settings-messages"></div>
				</form>

				<!-- Info Box -->
				<div class="angie-info-box">
					<h3><?php esc_html_e( '🚀 How to Use', 'angie' ); ?></h3>
					<ol>
						<li><?php esc_html_e( 'Get your OpenAI API key from the OpenAI dashboard', 'angie' ); ?></li>
						<li><?php esc_html_e( 'Enter your API key and endpoint above', 'angie' ); ?></li>
						<li><?php esc_html_e( 'Click "Test Connection" to verify settings', 'angie' ); ?></li>
						<li><?php esc_html_e( 'Click "Save Settings"', 'angie' ); ?></li>
						<li><?php esc_html_e( 'Go to any Elementor page and use the AI converter button (</>)', 'angie' ); ?></li>
					</ol>

					<h3><?php esc_html_e( '💡 Custom Endpoints', 'angie' ); ?></h3>
					<p>
						<?php esc_html_e( 'You can use any OpenAI-compatible API endpoint:', 'angie' ); ?>
					</p>
					<ul>
						<li><strong>OpenAI:</strong> https://api.openai.com/v1</li>
						<li><strong>Azure OpenAI:</strong> https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT</li>
						<li><strong>LocalAI:</strong> http://localhost:8080/v1</li>
						<li><strong>Ollama:</strong> http://localhost:11434/v1</li>
						<li><strong>Custom:</strong> Your own endpoint</li>
					</ul>
				</div>
			</div>
		</div>

		<style>
			.angie-ai-settings-wrap {
				max-width: 900px;
			}

			.required {
				color: #d63638;
			}

			.angie-info-box {
				background: #f0f6fc;
				border: 1px solid #c8d7e8;
				border-radius: 4px;
				padding: 20px;
				margin-top: 30px;
			}

			.angie-info-box h3 {
				margin-top: 0;
				color: #2c3e50;
			}

			.angie-info-box ul, .angie-info-box ol {
				line-height: 1.8;
			}

			#settings-messages {
				margin-top: 20px;
			}

			#settings-messages .notice {
				padding: 12px;
				border-left-width: 4px;
				border-left-style: solid;
				margin: 10px 0;
			}

			#settings-messages .notice-success {
				background: #d4edda;
				border-left-color: #28a745;
				color: #155724;
			}

			#settings-messages .notice-error {
				background: #f8d7da;
				border-left-color: #dc3545;
				color: #721c24;
			}

			#api-key-status.has-key {
				color: #28a745;
				font-weight: 600;
			}

			.button[disabled] {
				opacity: 0.6;
				cursor: not-allowed;
			}
		</style>
		<?php
	}
}
