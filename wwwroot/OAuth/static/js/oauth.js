(function(window) {
	let OAuth = {
        Login: {
            show: function(data) {
                if (data == null)
                    throw new Error("data is null");
                if (!data.hasOwnProperty('app_id'))
                    throw  new Error('not found app_id');
                if (!data.hasOwnProperty('redirect_uri'))
                    throw  new Error('not found redirect_uri');
                if (!data.hasOwnProperty('state'))
                    throw  new Error('not found state');

                let app_id = data.app_id;
                let width = data.width || 650;
                let height = data.height || 500;
                let top = (window.screen.availHeight - 30 - height) / 2;
                let left = (window.screen.availWidth - 10 - width) / 2;
                if (top >= 240) top -= 120;
                let url = "http://open.apowogame.com/open-login.html?app_id=" + data.app_id + "&redirect_uri=" + encodeURI(data.redirect_uri) + "&state=" + encodeURI(data.state);
                let options = "width=" + width + ",height=" + height + ",top=" + top + ",left=" + left + ",menubar=no,resizable=no";
                window.open(url, 'oauth login', options);
            }
        }
    };
	window.OAuth = OAuth;
})(window);