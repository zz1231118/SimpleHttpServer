define((require) => {
    let wui = require('static/wui');
    let $ = require('static/jquery');
    let windows = require('windows');
    let apps = require('app');
    let core = require('core');

    class Window extends windows.Window {
        constructor(url) {
            super(url);
        }

        initialize(context) {
            let valueFactory = (cell, column, obj) => {
                switch (column.property) {
                    case 'key':
                        var span_key = document.createElement('span');
                        span_key.style.display = 'inline-block;';
                        span_key.style.marginLeft = '10px';
                        span_key.style.minHeight = '26px';
                        span_key.style.lineHeight = '26px';
                        span_key.innerHTML = '********************************';
    
                        var btn_showhide = document.createElement('input');
                        btn_showhide.type = 'button';
                        btn_showhide.className = 'wui-btn wui-btn-default wui-btn-small';
                        btn_showhide.value = '显示';
                        btn_showhide.onclick = p => {
                            if (btn_showhide.value == '显示') {
                                btn_showhide.value = '隐藏';
                                span_key.innerHTML = obj.Key;
                            } else {
                                span_key.innerHTML = '********************************';
                                btn_showhide.value = '显示';
                            }
                        };
    
                        return new Array(btn_showhide, span_key);
                    case 'operate':
                        var btn_update = document.createElement('a');
                        btn_update.className = 'wui-btn wui-btn-default wui-btn-small';
                        btn_update.target = '_blank';
                        btn_update.style.marginRight = '4px';
                        btn_update.innerHTML = '<i class="icon-edit"></i>修改';
                        btn_update.onclick = p => {
                            win.app_id = obj.ID;
                            win.name = obj.Name;
                            win.domain = obj.Domain;
                            win.show();
                        };
                        var btn_delete = document.createElement('a');
                        btn_delete.className = 'wui-btn wui-btn-danger wui-btn-small';
                        btn_delete.innerHTML = '<i class="icon-trash icon-white"></i>删除</a>';
                        btn_delete.onclick = p => {
                            if (confirm('确认删除应用：' + obj.Name + '吗？', '删除提示')) {
                                Core.App.Delete({ app_id: obj.ID }, p => p.result ? dataview.remove(obj) : alert(p.data));
                            }
                        };
                        return new Array(btn_update, btn_delete);
                }
            };
            let dataview = new wui.DataView(context.getElementById('app_dataview'), valueFactory, valueFactory);
            core.app.Load(null, p => {
                p.result ? p.data.forEach(q => dataview.append(q)) : alert(p.data);
                super.initialize(context);
            });

            var win = {
                app_id: 0,
                name: null,
                domain: null,
                show: function() {
                    $('#update_app_name').val(this.name);
                    $('#update_app_domain').val(this.domain);
                    $('#_showalert').show();
                },
                close: function() {
                    $('#_showalert').hide();
                },
                submit: function() {
                    var name = $('#update_app_name');
                    var app_domain = $('#update_app_domain');
                    if (name.val() == '') {
                        alert("名称不能为空！");
                        return;
                    }
                    if (app_domain.val() === "") {
                        alert("域名不能为空！");
                        return;
                    }
                    
                    var param = {
                        app_id: this.app_id,
                        app_name: name.val(),
                        app_domain: app_domain.val()
                    };
                    core.app.Update(param, p => {
                        if (!p.result) {
                            alert(p.data);
                            return;
                        }
        
                        dataview.update(p.data);
                        win.close();
                    });
                },
            };
            $(context).find('#win-close').click(() => win.close());
            $(context).find('#win-submit').click(() => win.submit());
            $(context).find('#btn-add-apply').click(() => {
                apps.Application.current.open({ name: '添加应用', url: 'controller/new-app' });
            });
        }
    }

    return {
        Window: Window
    };
});