define((require) => {
    let wui = require('static/wui');
    let linq = require('static/netcore/system.linq');
    let $ = require('static/jquery');
    let windows = require('windows');
    let core = require('core');

    linq = linq.Enumerable;

    class Window extends windows.Window {
        constructor(url) {
            super(url);
        }

        initialize(context) {
            new wui.SelectCombox({
                id: context.getElementById('search-control'),
                options: [{ key: '帐号', value: 'Name' }, { key: '昵称', value: 'Nickname' }, { key: '实名', value: 'Realname' }],
                change: function(s, e) { dataview.filter(s.key, s.value); }
            });
            let valueFactory = (cell, column, obj) => {
                switch(column.property) {
                    case 'password':
                        var span_key = document.createElement('span');
                        span_key.style.display = 'inline-block;';
                        span_key.style.marginLeft = '10px';
                        span_key.style.minHeight = '26px';
                        span_key.style.lineHeight = '26px';
                        span_key.innerHTML = '**********';
    
                        var btn_showhide = document.createElement('input');
                        btn_showhide.type = 'button';
                        btn_showhide.className = 'wui-btn wui-btn-default wui-btn-small';
                        btn_showhide.value = '显示';
                        btn_showhide.onclick = p => {
                            if (btn_showhide.value == '显示') {
                                btn_showhide.value = '隐藏';
                                span_key.innerHTML = obj.Password;
                            } else {
                                span_key.innerHTML = '**********';
                                btn_showhide.value = '显示';
                            }
                        };
    
                        return new Array(btn_showhide, span_key);
                    case 'gender':
                        return obj.Gender == 0 ? '' : obj.Gender == 1 ? '男' : '女';
                    case 'available':
                        return obj.Available ? '<span style="color: green;">true</span>' : '<span style="color: red;">false</span>';
                    case 'operate':
                        var btn_update = document.createElement('a');
                        btn_update.className = 'wui-btn wui-btn-default wui-btn-small';
                        btn_update.target = '_blank';
                        btn_update.style.marginRight = '4px';
                        btn_update.innerHTML = '<i class="icon-edit"></i>修改';
                        btn_update.onclick = p => {
                            win.show(obj);
                        };
                        
                        return btn_update;
                }
            };
            let dataview = new wui.DataView(context.getElementById('dataview'), valueFactory, valueFactory);
            core.account.load(null, p => {
                if (!p.result) {
                    alert(p.data);
                    return;
                }
    
                let array = p.data;
                for (let p of linq.orderByDescending(array, p => p.Available).thenByDescending(p => p.AdminType)) {
                    dataview.append(p);
                }

                super.initialize(context);
            });
        
            var win = {
                _key: null,
                show: function(obj) {
                    this._key = obj.ID;
                    $('#win_name').val(obj.Name);
                    $('#win_admin_type').val(obj.AdminType);
                    $('#win_available').attr('checked', obj.Available);
                    $('#_showalert').show();
                },
                close: function() {
                    $('#_showalert').hide();
                },
                submit: function() {
                    var admin_type = parseInt($('#win_admin_type').val());
                    var available = $('#win_available').attr('checked');
                    var param = {
                        ID: this._key, 
                        AdminType: admin_type,
                        Available: available,
                    };
                    core.account.Update(param, p => {
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
        }
    }

    return {
        Window: Window
    };
});