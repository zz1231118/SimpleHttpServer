define((require) => {
    let $ = require('static/jquery');
    let windows = require('windows');
    let apps = require('app');
    let core = require('core');

    class Window extends windows.Window {
        constructor(url) {
            super(url);
        }

        initialize(context) {
            function new_app() {
                var app_name = $('#app_name');
                var app_domain = $('#app_domain');
                if (app_name.val() == "") {
                    alert("app 名称不能为空！");
                    return;
                }
                if (app_domain.val() == "") {
                    alert("域不能为空！");
                    return;
                }
        
                var data = {
                    app_name: app_name.val(),
                    app_domain: app_domain.val(),
                };
                core.app.Create(data, p => {
                    if (!p.result) {
                        alert(p.data);
                        return;
                    }

                    apps.Application.current.open('windows/app-list');
                });
            }

            function selectFile() {
                let element = document.getElementById('app_icon_file');
                element.click();
            }

            function uploadFile() {
                let self = document.getElementById('app_icon_file');
                let img = document.getElementById('app_icon');
                if (self.files.length == 0) {
                    if (img.src != '/static/img/upload-file.png') {
                        img.src = '/static/img/upload-file.png';
                    }
                } else {
                    let file = self.files[0];
                    var data = new FormData();
                    data.append("file", file);
                    $.ajax({
                        url: '/handler/AppHandler.ashx?action=UploadIcon',
                        type: 'POST',
                        async: true,
                        data: data,
                        contentType: false,
                        complete: function(xhr, status, responseText) {
                            if (status == 200) {
                                let p = $.eval(responseText);
                                if (!p.result) {
                                    alert('error:' + p.data);
                                    return;
                                }
        
                                img.src = p.data;
                            }
                        },
                    });
                }
            }

            $(context).find('#app_icon').click(selectFile);
            $(context).find('#btn-submit').click(new_app);
            $(context).find('#app_icon_file').get(0).onchange = uploadFile;
            super.initialize(context);
        }
    }

    return  {
        Window: Window,
    };
});