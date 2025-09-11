<?php
/**
 * Shortcode handler for Online Designer Forms
 */

class ODF_Shortcode {

    /**
     * Render the form using shortcode
     */
    public static function render_form($atts) {
        $atts = shortcode_atts(array(
            'id' => '',
        ), $atts, 'online_designer_form');

        if (empty($atts['id'])) {
            return '<div class="odf-error">Error: Form ID is required. Use [online_designer_form id="your-form-id"]</div>';
        }

        $form_id = sanitize_text_field($atts['id']);
        $form_data = ODF_API::get_form($form_id);

        if (!$form_data) {
            return '<div class="odf-error">Error: Unable to load form. Please check the form ID and API connection.</div>';
        }

        // Check if API returned an error
        if (is_array($form_data) && isset($form_data['error'])) {
            $error_msg = esc_html($form_data['error']);
            return '<div class="odf-error">Error: ' . $error_msg . '</div>';
        }

        ob_start();
        self::render_form_html($form_data, $form_id);
        return ob_get_clean();
    }

    /**
     * Render the form HTML
     */
    private static function render_form_html($form_data, $form_id) {
        ?>
        <div class="odf-form-container" data-form-id="<?php echo esc_attr($form_id); ?>">
            <?php if (isset($form_data['title'])): ?>
                <h2><?php echo esc_html($form_data['title']); ?></h2>
            <?php endif; ?>

            <?php if (isset($form_data['description'])): ?>
                <p><?php echo esc_html($form_data['description']); ?></p>
            <?php endif; ?>

            <form class="odf-form" method="post" action="">
                <?php if (isset($form_data['steps']) && is_array($form_data['steps'])): ?>
                    <?php foreach ($form_data['steps'] as $step): ?>
                        <div class="odf-step" data-step-id="<?php echo esc_attr($step['id']); ?>">
                            <?php if (isset($step['fields']) && is_array($step['fields'])): ?>
                                <?php foreach ($step['fields'] as $field): ?>
                                    <div class="odf-field">
                                        <label for="field_<?php echo esc_attr($field['id']); ?>"><?php echo esc_html($field['label']); ?></label>
                                        <?php self::render_field($field); ?>
                                    </div>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>

                <button type="submit" class="odf-submit-btn">Submit</button>
            </form>
        </div>
        <?php
    }

    /**
     * Render individual form field
     */
    private static function render_field($field) {
        $field_id = 'field_' . esc_attr($field['id']);
        $field_name = esc_attr($field['name'] ?? $field['id']);
        $field_type = esc_attr($field['type'] ?? 'text');
        $required = (isset($field['required']) && $field['required']) ? 'required' : '';
        $placeholder = isset($field['placeholder']) ? esc_attr($field['placeholder']) : '';

        switch ($field_type) {
            case 'text':
            case 'email':
            case 'tel':
            case 'url':
                echo '<input type="' . $field_type . '" id="' . $field_id . '" name="' . $field_name . '" placeholder="' . $placeholder . '" ' . $required . '>';
                break;
            case 'textarea':
                echo '<textarea id="' . $field_id . '" name="' . $field_name . '" placeholder="' . $placeholder . '" ' . $required . '></textarea>';
                break;
            case 'select':
                echo '<select id="' . $field_id . '" name="' . $field_name . '" ' . $required . '>';
                echo '<option value="">' . ($placeholder ?: 'Select an option') . '</option>';
                if (isset($field['options']) && is_array($field['options'])) {
                    foreach ($field['options'] as $option) {
                        $option_value = is_array($option) ? ($option['value'] ?? $option['label']) : $option;
                        $option_label = is_array($option) ? ($option['label'] ?? $option['value']) : $option;
                        echo '<option value="' . esc_attr($option_value) . '">' . esc_html($option_label) . '</option>';
                    }
                }
                echo '</select>';
                break;
            case 'radio':
                if (isset($field['options']) && is_array($field['options'])) {
                    foreach ($field['options'] as $index => $option) {
                        $option_value = is_array($option) ? ($option['value'] ?? $option['label']) : $option;
                        $option_label = is_array($option) ? ($option['label'] ?? $option['value']) : $option;
                        echo '<label><input type="radio" name="' . $field_name . '" value="' . esc_attr($option_value) . '" ' . $required . '> ' . esc_html($option_label) . '</label><br>';
                    }
                }
                break;
            case 'checkbox':
                echo '<input type="checkbox" id="' . $field_id . '" name="' . $field_name . '" ' . $required . '>';
                break;
            case 'file':
                echo '<input type="file" id="' . $field_id . '" name="' . $field_name . '" ' . $required . '>';
                break;
            default:
                echo '<input type="text" id="' . $field_id . '" name="' . $field_name . '" placeholder="' . $placeholder . '" ' . $required . '>';
        }
    }
}
?>
