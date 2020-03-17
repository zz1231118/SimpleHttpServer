(function(window) {
	let OAuth = {
        Login: {
            getUrl: function(data) {
                if (data == null)
                    throw "argument null exception: data";
                if (!data.hasOwnProperty('app_id'))
                    throw 'not found app_id';
                if (!data.hasOwnProperty('redirect_uri'))
                    throw 'not found redirect_uri';
                if (!data.hasOwnProperty('state'))
                    throw 'not found state';
    
                let url = 'http://open.apowogame.com/open-login.html';
                url += '?app_id=' + data.app_id;
                url += '&redirect_uri=' + encodeURI(data.redirect_uri);
                url += '&state=' + encodeURI(data.state);
                return url;
            },
            show: function(data) {
                if (data == null)
                    throw "argument null exception: data";

                let app_id = data.app_id;
                let width = data.width || 650;
                let height = data.height || 500;
                let top = (window.screen.availHeight - 30 - height) / 2;
                let left = (window.screen.availWidth - 10 - width) / 2;
                if (top >= 240) top -= 120;

                let url = this.getUrl(data);
                let options = "width=" + width;
                options += ",height=" + height;
                options += ",top=" + top;
                options += ",left=" + left;
                options += ",menubar=no,resizable=no";
                window.open(url, 'oauth login', options);
            }
        }
    };
    window.OAuth = OAuth;
    if (window['define']) {
        define((reqiure) => {
            return OAuth;
        });
    }
})(window);