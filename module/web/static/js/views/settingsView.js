define(['jquery', 'underscore', 'backbone', 'app', './input/inputLoader', 'models/ConfigHolder'],
    function($, _, Backbone, App, load_input, ConfigHolder) {

        // Renders settings over view page
        return Backbone.View.extend({

            el: "#content",
            templateMenu: _.compile($("#template-menu").html()),
            templateConfig: _.compile($("#template-config").html()),
            templateConfigItem: _.compile($("#template-config-item").html()),

            events: {
                'click .settings-menu li > a': 'change_section'
            },

            menu: null,
            content: null,

            core_config: null, // It seems models are not needed
            plugin_config: null,

            // currently open configHolder
            config: null,
            isLoading: false,

            initialize: function() {
                this.menu = this.$('.settings-menu');
                this.content = this.$('#settings-form');
                this.refresh();

                console.log("Settings initialized");
            },

            refresh: function() {
                var self = this;
                $.ajax(App.apiRequest("getCoreConfig", null, {success: function(data) {
                    self.core_config = data;
                    self.render();
                }}));
                $.ajax(App.apiRequest("getPluginConfig", null, {success: function(data) {
                    self.plugin_config = data;
                    self.render();
                }}));
            },

            render: function() {
                this.menu.html(this.templateMenu({
                    core: this.core_config,
                    plugin: this.plugin_config
                }));
            },

            openConfig: function(name) {
                // Do nothing when this config is already open
                if (this.config && this.config.get('name') === name)
                    return;

                this.config = new ConfigHolder({name: name});
                this.loading();

                var self = this;
                this.config.fetch({success: function() {
                    if (!self.isLoading)
                        self.show();

                }, failure: _.bind(this.failure, this)});

            },

            loading: function() {
                this.isLoading = true;
                var self = this;
                this.content.fadeOut({complete: function() {
                    if (self.config.isLoaded())
                        self.show();

                    self.isLoading = false;
                }});

            },

            show: function() {
                // TODO: better refactor in separate views
                this.content.html(this.templateConfig(this.config.toJSON()));
                var container = this.content.find('.control-content');
                var items = this.config.get('items');
                var self = this;
                _.each(items, function(item) {
                    var el = $('<div>').html(self.templateConfigItem(item.toJSON()));
                    var inputView = load_input("todo");
                    el.find('.controls').append(
                        new inputView(item.get('input'), item.get('value'),
                            item.get('default_value'), item.get('description')).render().el);
                    container.append(el);
                });

                this.content.fadeIn();
            },

            failure: function() {

            },

            change_section: function(e) {
                // TODO check for changes

                var el = $(e.target).parent();
                var name = el.data("name");
                this.openConfig(name);

                this.menu.find("li.active").removeClass("active");
                el.addClass("active");
                e.preventDefault();
            }

        });
    });