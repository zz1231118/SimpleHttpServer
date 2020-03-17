define((require) => {
    let wui = require('static/wui');
    let linqs = require('static/netcore/system.linq');
    let $ = require('static/jquery');
    let windows = require('windows');
    let core = require('core');
    let route = require('route');

    let linq = linqs.Enumerable;
    let Result = route.Result;

    class Window extends windows.Window {
        constructor(url) {
            super(url);
        }

        initialize(context) {
            let dataview = new wui.DataView(context.getElementById('dataview'), (cell, column, obj) => {
                switch(column.property) {
                    case 'operate':
                        if (obj.Available) {
                            var btn_delete = document.createElement('a');
                            btn_delete.className = 'wui-btn wui-btn-small wui-btn-danger';
                            btn_delete.innerHTML = '<i class="icon-trash icon-white"></i>删除';
                            btn_delete.onclick = p => {
                                if (!confirm('确认删除此邀请码吗？')) {
                                    return;
                                }
                                
                                core.invite.Delete({ id: obj.ID }, p => Result.check(p) ? dataview.remove(obj) : alert(p.data));
                            };
                            return btn_delete;
                        }
                }
            });
    
            function reloadInvite(callback) {
                dataview.clear();
                core.invite.Load(null, p => {
                    Result.check(p);
                    linq.orderByDescending(p.data, p => p.Available).forEach(p => dataview.append(p));
                    callback && callback();
                });
            }
            $(context).find('#btn-build').click(() => {
                let count = $(context).find('#build_count').val();
                if (count <= 0) {
                    alert("生成数量不能小于0！");
                    return;
                }
                
                core.invite.Build({ count: count }, p => {
                    if (!Result.check(p)) {
                        alert(p.data);
                        return;
                    }
    
                    reloadInvite();
                    //p.data.forEach(q => dataview.append(q));
                    alert("生成成功...");
                });
            });
    
            reloadInvite(() => super.initialize(context));
        }
    }

    return {
        Window: Window
    };
});