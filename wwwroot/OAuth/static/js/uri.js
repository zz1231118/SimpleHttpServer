define((require) => {
    var Uri = function(url) {
        if (url == null) {
            throw 'argument null';
        }
        
        //var url = 'http://username:password@www.bbs0101.com:1234/artical/js/index.php?key1=js&key2=css#anchor';
        var pattern = /^(?:(\w+):\/\/)?(?:(\w+):?(\w+)?@)?([^:\/\?#]+)(?::(\d+))?(\/[^\?#]+)?(?:\?([^#]+))?(?:#(\w+))?/;
        var result = pattern.exec(url);
        this.protocol = result[1];
        this.host = result[4];
        if (result[5] != null) {
            this.host += ':' + result[5];
        }
        this.port = result[5] || 80;
    };
    Uri.match = function(url) {
        if (url == null) {
            return false;
        }
        var reg = /(http|https):\/\/localhost(:\d+)?/;
        if (reg.test(url)) {
            return true;
        }
        reg = /(http|https):\/\/((25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))\.){3}(25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))(:\d+)?/;
        if (reg.test(url)) {
            return true;
        }
        reg = /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;
        return reg.test(url);
    }
    return Uri;
});