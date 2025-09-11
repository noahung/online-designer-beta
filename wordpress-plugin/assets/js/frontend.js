// Frontend JS for Online Designer Forms

jQuery(document).ready(function($) {
    $('.odf-form').on('submit', function(e) {
        e.preventDefault();

        var form = $(this);
        var formData = form.serializeArray();
        var formId = form.closest('.odf-form-container').data('form-id');

        // Convert to object
        var data = {};
        $.each(formData, function() {
            data[this.name] = this.value;
        });

        // Submit via AJAX
        $.ajax({
            url: odf_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'odf_submit_form',
                form_id: formId,
                form_data: JSON.stringify(data),
                nonce: odf_ajax.nonce
            },
            success: function(response) {
                if (response.success) {
                    alert('Form submitted successfully!');
                    form[0].reset();
                } else {
                    alert('Error submitting form: ' + response.data);
                }
            },
            error: function() {
                alert('Error submitting form.');
            }
        });
    });
});
