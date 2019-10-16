/* jshint strict: true, esversion: 6 */
/* globals document */
/**
 * Options Page
 *
 * Copyright © 2014-2019 Ruslan Osmanov <rrosmanov@gmail.com>
 */
(function () {
    'use strict';
    let save_options = () => {
        localStorage['bee-editor'] = document.getElementById('bee-editor').value;
    };

    let restore_options = () => {
        let editor = localStorage['bee-editor'];
        if (editor) {
            document.getElementById('bee-editor').value = editor;
        }
    };

    document.addEventListener('DOMContentLoaded', restore_options);
    document.querySelector('#bee-editor')
        .addEventListener('blur', save_options);
})();
