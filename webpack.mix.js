const mix = require('laravel-mix');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

mix.scripts([
    'node_modules/jquery/dist/jquery.js',
    'node_modules/popper.js/dist/umd/popper.js',
    'node_modules/bootstrap/dist/js/bootstrap.js'
], 'public/assets/js/core.js').version();

mix.scripts([
    'resources/js/plugins/bootstrap-datepicker.js',
    'resources/js/plugins/bootstrap-notify.js',
    'resources/js/plugins/bootstrap-switch.js',
    'resources/js/plugins/chartist.js',
    'resources/js/plugins/nouislider.js',
    'resources/js/light-bootstrap-dashboard.js'
], 'public/assets/js/plugins.js').version();

mix.scripts('resources/js/app.js', 'public/assets/js/app.js').version();

mix.sass('resources/sass/app.scss', 'public/assets/css').version();
mix.sass('resources/sass/custom.scss', 'public/assets/css').version();

mix.browserSync({
    proxy: 'l7base.test',
    open: false
});
