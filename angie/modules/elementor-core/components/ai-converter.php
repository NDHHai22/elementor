<?php

namespace Angie\Modules\ElementorCore\Components;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * AI Converter Component
 *
 * Converts HTML to Elementor JSON using OpenAI API
 */
class AI_Converter {

	/**
	 * REST API namespace
	 *
	 * @var string
	 */
	protected $namespace = 'angie/v1';

	/**
	 * REST API base
	 *
	 * @var string
	 */
	protected $rest_base = 'ai-convert';

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'rest_api_init', [ $this, 'register_routes' ] );
	}

	/**
	 * Register REST API routes
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'convert_html' ],
				'permission_callback' => [ $this, 'permissions_check' ],
				'args'                => [
					'prompt' => [
						'type'              => 'string',
						'required'          => false,
						'description'       => 'User prompt describing what to create',
						'validate_callback' => function( $value, $request, $key ) {
							// At least one of 'prompt' or 'html' must be provided
							$params = $request->get_json_params() ?: $request->get_body_params();
							return ! empty( $params['prompt'] ) || ! empty( $params['html'] );
						},
					],
					'html' => [
						'type'              => 'string',
						'required'          => false,
						'description'       => 'HTML to improve/convert (backward compatibility)',
						'validate_callback' => function( $value, $request, $key ) {
							// At least one of 'prompt' or 'html' must be provided
							$params = $request->get_json_params() ?: $request->get_body_params();
							return ! empty( $params['prompt'] ) || ! empty( $params['html'] );
						},
					],
					'context' => [
						'type'        => 'string',
						'required'    => false,
						'description' => 'Additional context or instructions',
					],
				],
			]
		);
	}

	/**
	 * Check permissions
	 *
	 * @return bool
	 */
	public function permissions_check() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Convert user prompt to HTML using OpenAI, then convert to Elementor JSON
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function convert_html( $request ) {
		$params = $request->get_json_params() ?: $request->get_body_params();
		
		// Determine if this is AI generation or direct HTML conversion
		$is_ai_mode = ! empty( $params['prompt'] );
		$is_html_mode = ! empty( $params['html'] );
		
		if ( ! $is_ai_mode && ! $is_html_mode ) {
			return new \WP_Error(
				'missing_input',
				__( 'Prompt or HTML content is required.', 'angie' ),
				[ 'status' => 400 ]
			);
		}

		$context = isset( $params['context'] ) ? $params['context'] : '';
		$html_to_convert = '';

		// Mode 1: Direct HTML conversion (no AI needed)
		if ( $is_html_mode && ! $is_ai_mode ) {
			error_log( '=== HTML-Only Mode (No AI) ===' );
			$html_to_convert = $params['html'];
			
			// Step: Use SMART HTML to Elementor converter directly
			$converter = new Smart_Html_Converter();
			
			try {
				$elementor_elements = $converter->parse( $html_to_convert );
				
				error_log( 'Input HTML length: ' . strlen( $html_to_convert ) );
				error_log( 'Elementor elements count: ' . count( $elementor_elements ) );
				
				return rest_ensure_response( [
					'success'  => true,
					'elements' => $elementor_elements,
					'html'     => $html_to_convert,
					'message'  => count( $elementor_elements ) . ' element(s) converted from HTML',
				] );
				
			} catch ( \Exception $e ) {
				return new \WP_Error(
					'conversion_error',
					sprintf( __( 'HTML conversion failed: %s', 'angie' ), $e->getMessage() ),
					[ 'status' => 500 ]
				);
			}
		}

		// Mode 2: AI generation mode (requires API key)
		$api_key = AI_Settings::get_api_key();
		$endpoint = AI_Settings::get_endpoint();
		$model = AI_Settings::get_model();
		$temperature = AI_Settings::get_temperature();

		if ( empty( $api_key ) ) {
			return new \WP_Error(
				'missing_api_key',
				__( 'OpenAI API Key is not configured. Please configure it in Settings.', 'angie' ),
				[ 'status' => 400 ]
			);
		}

		error_log( '=== AI Generation Mode ===' );
		
		// Accept either 'prompt' or 'html' as user input for AI
		$user_input = $params['prompt'];

		// Step 1: Use AI to generate HTML
		$generated_html = $this->generate_html_with_ai( $user_input, $context, $api_key, $endpoint, $model, $temperature );
		
		if ( is_wp_error( $generated_html ) ) {
			return $generated_html;
		}

		// Step 2: Use SMART HTML to Elementor converter
		$converter = new Smart_Html_Converter();
		
		try {
			$elementor_elements = $converter->parse( $generated_html );
			
			// Debug logging
			error_log( '=== AI Converter Debug ===' );
			error_log( 'Generated HTML length: ' . strlen( $generated_html ) );
			error_log( 'Generated HTML preview: ' . substr( $generated_html, 0, 200 ) );
			error_log( 'Elementor elements count: ' . count( $elementor_elements ) );
			if ( ! empty( $elementor_elements ) ) {
				error_log( 'First element: ' . print_r( $elementor_elements[0], true ) );
			}
			
			return rest_ensure_response( [
				'success'       => true,
				'elements'      => $elementor_elements,
				'html'          => $generated_html,
				'message'       => 'HTML generated and converted to Elementor format with smart styling',
				'debug'         => [
					'html_length'    => strlen( $generated_html ),
					'elements_count' => count( $elementor_elements ),
				],
			] );
			
		} catch ( \Exception $e ) {
			error_log( 'Conversion error: ' . $e->getMessage() );
			error_log( 'Stack trace: ' . $e->getTraceAsString() );
			
			return new \WP_Error(
				'conversion_error',
				sprintf( __( 'Failed to convert HTML to Elementor: %s', 'angie' ), $e->getMessage() ),
				[ 
					'status'        => 500,
					'generated_html' => $generated_html,
				]
			);
		}
	}

	/**
	 * Generate HTML using AI
	 *
	 * @param string $user_input User prompt or existing HTML
	 * @param string $context Additional context
	 * @param string $api_key OpenAI API key
	 * @param string $endpoint API endpoint
	 * @param string $model AI model
	 * @param float $temperature Temperature setting
	 * @return string|WP_Error Generated HTML or error
	 */
	private function generate_html_with_ai( $user_input, $context, $api_key, $endpoint, $model, $temperature ) {
		// Build the prompt
		$system_prompt = $this->get_html_generation_prompt();
		$user_prompt = $this->build_html_user_prompt( $user_input, $context );

		// Call OpenAI API
		$response = wp_remote_post(
			trailingslashit( $endpoint ) . 'chat/completions',
			[
				'headers' => [
					'Content-Type'  => 'application/json',
					'Authorization' => 'Bearer ' . $api_key,
				],
				'body'    => wp_json_encode( [
					'model'       => $model,
					'messages'    => [
						[
							'role'    => 'system',
							'content' => $system_prompt,
						],
						[
							'role'    => 'user',
							'content' => $user_prompt,
						],
					],
					'temperature' => $temperature,
					'max_tokens'  => 500000, // Increased for longer HTML
				] ),
				'timeout' => 300, // Increased timeout
			]
		);

		if ( is_wp_error( $response ) ) {
			return new \WP_Error(
				'api_request_failed',
				sprintf( __( 'API request failed: %s', 'angie' ), $response->get_error_message() ),
				[ 'status' => 500 ]
			);
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $status_code !== 200 ) {
			$error_message = isset( $body['error']['message'] ) 
				? $body['error']['message'] 
				: __( 'Unknown API error', 'angie' );

			return new \WP_Error(
				'api_error',
				sprintf( __( 'API Error (%d): %s', 'angie' ), $status_code, $error_message ),
				[ 'status' => $status_code ]
			);
		}

		// Extract the response
		if ( ! isset( $body['choices'][0]['message']['content'] ) ) {
			return new \WP_Error(
				'invalid_response',
				__( 'Invalid response from AI API.', 'angie' ),
				[ 'status' => 500 ]
			);
		}

		$html = $body['choices'][0]['message']['content'];
		
		// Clean HTML (remove markdown code blocks if present)
		$html = $this->extract_html( $html );

		return $html;
	}

	/**
	 * Get system prompt for HTML generation
	 *
	 * @return string
	 */
	private function get_html_generation_prompt() {
		return <<<'PROMPT'
You are an expert HTML/CSS developer. Your task is to generate clean, semantic HTML code based on user requirements.

CRITICAL RULES:
1. Return ONLY valid HTML - no explanations, no markdown code blocks
2. Use semantic HTML5 tags (header, section, article, nav, footer, etc.)
3. Add appropriate CSS classes for styling
4. Make it responsive and accessible
5. Use modern HTML best practices

EXAMPLES:

User: "Create a hero section with title and button"
Your output:
<section class="hero">
  <h1>Welcome to Our Website</h1>
  <p>Discover amazing products and services</p>
  <a href="#" class="btn btn-primary">Get Started</a>
</section>

User: "Create a feature list with 3 items"
Your output:
<section class="features">
  <div class="feature-item">
    <h3>Fast Performance</h3>
    <p>Lightning-fast load times</p>
  </div>
  <div class="feature-item">
    <h3>Secure</h3>
    <p>Enterprise-grade security</p>
  </div>
  <div class="feature-item">
    <h3>Scalable</h3>
    <p>Grows with your business</p>
  </div>
</section>

IMPORTANT:
- NO markdown (no ```html or ```)
- NO explanations before or after
- ONLY clean HTML output
- Start directly with HTML tags
PROMPT;
	}

	/**
	 * Build user prompt for HTML generation
	 *
	 * @param string $user_input User's request or HTML
	 * @param string $context Additional context
	 * @return string
	 */
	private function build_html_user_prompt( $user_input, $context ) {
		// Check if input is already HTML
		if ( preg_match( '/<[^>]+>/', $user_input ) ) {
			// If it's HTML, just improve/clean it
			$prompt = "Clean and improve this HTML:\n\n{$user_input}";
		} else {
			// If it's a description, generate HTML
			$prompt = "Generate HTML for: {$user_input}";
		}

		if ( ! empty( $context ) ) {
			$prompt .= "\n\nAdditional context: {$context}";
		}

		return $prompt;
	}

	/**
	 * Extract HTML from AI response (remove markdown if present)
	 *
	 * @param string $response AI response
	 * @return string Clean HTML
	 */
	private function extract_html( $response ) {
		// Remove markdown code blocks
		$html = preg_replace( '/```html\s*/i', '', $response );
		$html = preg_replace( '/```\s*$/i', '', $html );
		$html = trim( $html );

		return $html;
	}

	/**
	 * Get system prompt for AI (DEPRECATED - kept for backward compatibility)
	 *
	 * @return string
	 */
	private function get_system_prompt() {
		return <<<'PROMPT'
You are an expert Elementor developer. Your task is to convert HTML into exact Elementor JSON format.

CRITICAL RULES:
1. Return ONLY valid JSON array - no explanations, no markdown
2. Each element must have ALL required fields
3. Use exact Elementor structure and field names
4. Generate 8-character hex IDs for each element

ELEMENTOR WIDGET STRUCTURE:
{
  "id": "abc12345",
  "elType": "widget",
  "isInner": false,
  "isLocked": false,
  "settings": {
    // Widget-specific settings
  },
  "defaultEditSettings": {
    "defaultEditRoute": "content"
  },
  "elements": [],
  "widgetType": "button|heading|text-editor|image|etc",
  "editSettings": {
    "defaultEditRoute": "content"
  },
  "htmlCache": ""
}

WIDGET TYPE MAPPINGS:
- <h1-h6> → widgetType: "heading", settings: {title, header_size, align}
- <p> → widgetType: "text-editor", settings: {editor (innerHTML)}
- <button> or <a> → widgetType: "button", settings: {text, link, align, size}
- <img> → widgetType: "image", settings: {image: {url, id, alt}, align}
- <ul>,<ol> → widgetType: "icon-list", settings: {icon_list: [{text, icon, _id}]}
- <div>,<section> with children → Create section+column structure

SECTION+COLUMN STRUCTURE (for containers):
{
  "id": "...",
  "elType": "section",
  "isInner": false,
  "isLocked": false,
  "settings": {
    "structure": "10",
    "content_width": "boxed",
    "gap": "default"
  },
  "elements": [{
    "id": "...",
    "elType": "column",
    "settings": {
      "_column_size": 100,
      "_inline_size": null
    },
    "elements": [
      // Widgets with isInner: true
    ]
  }]
}

BUTTON SETTINGS:
{
  "text": "Button text",
  "link": {"url": "#", "is_external": "", "nofollow": ""},
  "align": "left|center|right",
  "size": "md",
  "button_type": "primary"
}

HEADING SETTINGS:
{
  "title": "Heading text",
  "header_size": "h1|h2|h3|h4|h5|h6",
  "align": "left|center|right"
}

TEXT EDITOR SETTINGS:
{
  "editor": "<p>HTML content</p>"
}

IMAGE SETTINGS:
{
  "image": {"url": "https://...", "id": "", "alt": ""},
  "image_size": "full",
  "align": "center"
}

IMPORTANT:
- ONLY return JSON array
- NO markdown code blocks
- NO explanations
- Generate unique 8-char hex IDs
- Preserve HTML styling hints in settings
PROMPT;
	}

	/**
	 * Build user prompt
	 *
	 * @param string $html
	 * @param string $context
	 * @return string
	 */
	private function build_user_prompt( $html, $context = '' ) {
		$prompt = "Convert this HTML to Elementor JSON:\n\n```html\n{$html}\n```\n\n";
		
		if ( ! empty( $context ) ) {
			$prompt .= "Context: {$context}\n\n";
		}

		$prompt .= "Return ONLY the JSON array. Example format:\n";
		$prompt .= '[{"id":"abc12345","elType":"widget","widgetType":"heading","isInner":false,"isLocked":false,"settings":{"title":"Hello","header_size":"h1"},"defaultEditSettings":{"defaultEditRoute":"content"},"elements":[],"editSettings":{"defaultEditRoute":"content"},"htmlCache":""}]';

		return $prompt;
	}

	/**
	 * Extract JSON from AI response
	 *
	 * @param string $response
	 * @return array|null
	 */
	private function extract_json( $response ) {
		// Remove markdown code blocks if present
		$response = preg_replace( '/```json\s*/', '', $response );
		$response = preg_replace( '/```\s*$/', '', $response );
		$response = trim( $response );

		// Try to decode
		$json = json_decode( $response, true );

		if ( json_last_error() === JSON_ERROR_NONE && is_array( $json ) ) {
			return $json;
		}

		// Try to find JSON array in response
		if ( preg_match( '/\[.*\]/s', $response, $matches ) ) {
			$json = json_decode( $matches[0], true );
			if ( json_last_error() === JSON_ERROR_NONE && is_array( $json ) ) {
				return $json;
			}
		}

		return null;
	}
}
