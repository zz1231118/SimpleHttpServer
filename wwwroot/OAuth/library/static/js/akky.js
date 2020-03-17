var akky;
(function (akky) {
    class Type {
        static isType(obj, type) {
            if (name == null)
                throw 'argument null exception: type';
            return {}.toString.call(obj) == '[object ' + type + ']';
        }
        static isObject(obj) {
            return Type.isType(obj, 'Object');
        }
        static isString(obj) {
            return Type.isType(obj, 'String');
        }
        static isArray(obj) {
            return Type.isType(obj, 'Array');
        }
        static isFunction(obj) {
            return Type.isType(obj, 'Function');
        }
        static isUndefined(obj) {
            return Type.isType(obj, 'Undefined');
        }
    }
    class Uri {
        static combine(lh, rh) {
            if (lh == null || lh == '')
                return rh;
            if (rh == null || rh == '')
                return lh;
            if (lh.charAt(lh.length - 1) == Uri.Separator)
                lh = lh.substring(0, lh.length - 1);
            if (rh.charAt(0) != Uri.Separator)
                rh = Uri.Separator + rh;
            return lh + rh;
        }
        static getParent(url) {
            if (url == null || url == '')
                return url;
            let match = url.match(Uri.PARENT_RE);
            return match ? match[0] : url;
        }
        static isAbsoluteUrl(url) {
            return Uri.ABSOLUTE_RE.test(url);
        }
    }
    Uri.ABSOLUTE_RE = /^\/\/.|:\//;
    Uri.PARENT_RE = /^.*?\/\/.*?\/(.*?\/)*/;
    Uri.Separator = '/';
    Uri.SchemeDelimiter = '://';
    class Script {
        static parseReferences(code) {
            let ret = new Array();
            code.replace(Script.SLASH_RE, '')
                .replace(Script.REQUIRE_RE, function (m, m1, m2) {
                if (m2) {
                    ret.push(m2);
                }
                return '';
            });
            return ret;
        }
        static execScript(scriptText) {
            if (scriptText == null)
                throw 'argument null exception: scriptText';
            if (window['execScript']) {
                return window['execScript'].call(window, scriptText);
            }
            else {
                return eval(scriptText);
            }
        }
        static getHtmlScript(html) {
            if (html == null)
                throw 'argument null exception: html';
            let array = new Array();
            let jscontained = html.match(Script.SCRIPT_LABEL_LIST_RE);
            if (jscontained) {
                let count = jscontained.length;
                for (let i = 0; i < count; i++) {
                    let match = jscontained[i].match(Script.SCRIPT_LABEL_RE);
                    let scriptText = match[2];
                    if (scriptText) {
                        array.push(scriptText);
                    }
                }
            }
            return array;
        }
        static execHtmlScript(html) {
            if (html == null)
                throw 'argument null exception: html';
            let scriptTexts = Script.getHtmlScript(html);
            for (let scriptText of scriptTexts) {
                Script.execScript(scriptText);
            }
        }
    }
    Script.REQUIRE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*require|(?:^|[^$])\brequire\s*\(\s*(["'])(.+?)\1\s*\)/g;
    Script.SLASH_RE = /\\\\/g;
    Script.SCRIPT_LABEL_LIST_RE = /<script(.|\n)*?>(.|\n|\r\n)*?<\/script>/ig;
    Script.SCRIPT_LABEL_RE = /<script(.|\n)*?>((.|\n|\r\n)*)?<\/script>/im;
    akky.Script = Script;
    let AssemblyLoaderStatus;
    (function (AssemblyLoaderStatus) {
        AssemblyLoaderStatus[AssemblyLoaderStatus["none"] = 0] = "none";
        AssemblyLoaderStatus[AssemblyLoaderStatus["loading"] = 1] = "loading";
        AssemblyLoaderStatus[AssemblyLoaderStatus["success"] = 2] = "success";
        AssemblyLoaderStatus[AssemblyLoaderStatus["error"] = 3] = "error";
    })(AssemblyLoaderStatus || (AssemblyLoaderStatus = {}));
    class AssemblyLoader {
        constructor(assembly) {
            this._assembly = assembly;
            this._status = AssemblyLoaderStatus.none;
        }
        get status() {
            return this._status;
        }
        onScriptCompleted(evt) {
            let node = (evt.currentTarget || evt.srcElement);
            if ('onload' in node) {
                node.onload = node.onerror = null;
            }
            else {
                let el = node;
                el.onreadystatechange = null;
            }
            this._parent.removeChild(node);
            this._callback.call(this);
        }
        onScriptLoad(evt) {
            let readyRegExp = navigator.platform === 'PLAYSTATION 3' ? /^complete$/ : /^(complete|loaded)$/;
            if (evt.type === 'load' || (readyRegExp.test((evt.currentTarget || evt.srcElement)['readyState']))) {
                this._status = AssemblyLoaderStatus.success;
                this.onScriptCompleted(evt);
            }
        }
        onScriptError(evt) {
            this._status = AssemblyLoaderStatus.error;
            this.onScriptCompleted(evt);
        }
        load(callback) {
            this._callback = callback;
            let setup = this._assembly.appDomain.setup;
            let node = document.createElement('script');
            node.type = 'text/javascript';
            node.charset = setup.charset;
            node.src = this._assembly.url;
            node.async = true;
            if (setup.crossorigin !== undefined) {
                node.setAttribute('crossorigin', setup.crossorigin);
            }
            if ('onload' in node) {
                node.onload = e => this.onScriptLoad(e);
                node.onerror = e => this.onScriptError(e);
            }
            else {
                let el = node;
                el.onreadystatechange = e => {
                    if (/loaded|complete/.test(el.readyState)) {
                        this.onScriptLoad(e);
                    }
                };
            }
            this._parent = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
            this._status = AssemblyLoaderStatus.loading;
            this._parent.appendChild(node);
        }
    }
    let AssemblyStatus;
    (function (AssemblyStatus) {
        AssemblyStatus[AssemblyStatus["none"] = 0] = "none";
        AssemblyStatus[AssemblyStatus["fetching"] = 1] = "fetching";
        AssemblyStatus[AssemblyStatus["loading"] = 2] = "loading";
        AssemblyStatus[AssemblyStatus["loaded"] = 3] = "loaded";
        AssemblyStatus[AssemblyStatus["executing"] = 4] = "executing";
        AssemblyStatus[AssemblyStatus["executed"] = 5] = "executed";
        AssemblyStatus[AssemblyStatus["error"] = 6] = "error";
    })(AssemblyStatus || (AssemblyStatus = {}));
    class Assembly {
        constructor(appDomain, url) {
            this._appDomain = appDomain;
            this._url = url;
            this._status = AssemblyStatus.none;
            this._loadEvents = new Array();
        }
        get appDomain() {
            return this._appDomain;
        }
        get url() {
            return this._url;
        }
        get references() {
            return this._references;
        }
        get dependencies() {
            return this._dependencies;
        }
        get exports() {
            if (this._status == AssemblyStatus.error) {
                throw new Error('module was broken: ' + this._url);
            }
            else if (this._status < AssemblyStatus.loaded) {
                throw new Error('module not initialized: ' + this._url + '. status: ' + this._status);
            }
            else if (this._status == AssemblyStatus.loaded) {
                let mod = this;
                this._status = AssemblyStatus.executing;
                this._exports = new Object();
                if (this._factory != null) {
                    let require = function (uri) {
                        let dependency = mod.getDependency(uri);
                        return dependency.exports;
                    };
                    require.url = this._url;
                    require.resolve = function (uri) {
                        return mod.resolve(uri);
                    };
                    require.async = function (reference, callback) {
                        let url = mod.resolve('async_' + Assembly.creator());
                        mod._appDomain.invoke(url, reference, callback);
                    };
                    let exports = this._factory.call(this._exports, require, this._exports, this);
                    if (exports !== undefined) {
                        this._exports = exports;
                    }
                    delete this._factory;
                }
                this._status = AssemblyStatus.executed;
            }
            return this._exports;
        }
        set exports(value) {
            this._exports = value;
        }
        static creator() {
            return ++Assembly._maxid;
        }
        static load(appDomain, url, callback) {
            let assembly = new Assembly(appDomain, url);
            assembly._status = AssemblyStatus.fetching;
            let assemblyLoader = new AssemblyLoader(assembly);
            assemblyLoader.load(() => {
                if (assemblyLoader.status === AssemblyLoaderStatus.error) {
                    assembly._status = AssemblyStatus.error;
                    assembly._loadEvents.push(callback);
                    assembly.dispatchLoadEvent();
                    return;
                }
                if (appDomain.anonymousMetadata != null) {
                    let metadata = appDomain.anonymousMetadata;
                    appDomain.anonymousMetadata = null;
                    assembly._factory = metadata.factory;
                    assembly._references = metadata.references;
                }
                else {
                    assembly._references = new Array();
                }
                assembly._status = AssemblyStatus.none;
                assembly.loadCore(callback);
            });
            return assembly;
        }
        static loadFrom(appDomain, url, references, callback) {
            let assembly = new Assembly(appDomain, url);
            assembly._references = references;
            assembly.loadCore(callback);
            return assembly;
        }
        resolve(uri) {
            return this._appDomain.resolve(uri, this);
        }
        getDependency(uri) {
            let url = this.resolve(uri);
            for (let dependency of this._dependencies) {
                if (dependency.url == url) {
                    return dependency;
                }
            }
            throw 'dependency url: ' + url + ' not found.';
        }
        doLoadCompleted() {
            this._status = AssemblyStatus.loaded;
            this.dispatchLoadEvent();
        }
        dispatchLoadEvent() {
            for (let listener of this._loadEvents) {
                listener.call(this, this);
            }
            delete this._loadEvents;
        }
        loadCore(callback) {
            if (this._status >= AssemblyStatus.loaded) {
                callback.call(this, this);
                return;
            }
            if (this._status >= AssemblyStatus.fetching && this._status <= AssemblyStatus.loading) {
                this._loadEvents.push(callback);
                return;
            }
            let count = 0;
            let total = 0;
            this._loadEvents.push(callback);
            this._status = AssemblyStatus.loading;
            this._dependencies = new Array(this._references.length);
            for (let i = 0; i < this._references.length; i++) {
                let reference = this._references[i];
                let url = this.resolve(reference);
                let dependency = this._appDomain.getAssembly(url);
                if (dependency != null) {
                    if (dependency._status >= AssemblyStatus.fetching && dependency._status <= AssemblyStatus.loading) {
                        total++;
                        dependency.loadCore(() => {
                            if (++count === total) {
                                this.doLoadCompleted();
                            }
                        });
                    }
                }
                else {
                    total++;
                    dependency = this._appDomain.loadAssembly(url, () => {
                        if (++count === total) {
                            this.doLoadCompleted();
                        }
                    });
                }
                this._dependencies[i] = dependency;
            }
            if (total == 0) {
                this.doLoadCompleted();
            }
        }
    }
    Assembly._maxid = 0;
    class AssemblyMetadata {
    }
    class AppDomain {
        constructor(setup) {
            this._setup = setup;
            this._assemblies = new Array();
            this._baseUri = (!location.href || AppDomain.IGNORE_LOCATION_RE.test(location.href)) ? '' : this.dirname(location.href);
            if (!Uri.isAbsoluteUrl(setup.baseUrl)) {
                let first = setup.baseUrl.charCodeAt(0);
                switch (first) {
                    case 46: // .
                        setup.baseUrl = this._baseUri + setup.baseUrl.substring(2);
                        break;
                    case 47: // /
                        setup.baseUrl = location.origin + '/' + setup.baseUrl.substring(1);
                        break;
                    default:
                        setup.baseUrl = this._baseUri + setup.baseUrl;
                        break;
                }
            }
        }
        static get currentDomain() {
            if (AppDomain._currentDomain == null) {
                AppDomain._currentDomain = new AppDomain({
                    baseUrl: '/'
                });
            }
            return AppDomain._currentDomain;
        }
        static set currentDomain(value) {
            AppDomain._currentDomain = value;
        }
        get setup() {
            return this._setup;
        }
        dirname(path) {
            return path.match(AppDomain.DIRNAME_RE)[0];
        }
        parsePaths(uri) {
            if (this._setup.paths) {
                let paths = this._setup.paths;
                let m = uri.match(AppDomain.PATHS_RE);
                if (m && Type.isString(paths[m[1]])) {
                    let lh = paths[m[1]];
                    let rh = m[2];
                    uri = (lh.charCodeAt(lh.length - 1) === 47 ? lh : lh + '/') + (rh.charCodeAt(0) === 47 ? rh.substring(1) : rh);
                }
            }
            return uri;
        }
        parseVars(uri) {
            let vars = this._setup.vars;
            if (vars && uri.indexOf('{') > -1) {
                uri = uri.replace(AppDomain.VARS_RE, (m, key) => {
                    return Type.isString(vars[key]) ? vars[key] : m;
                });
            }
            return uri;
        }
        parseLibrary(uri) {
            let libraries = this._setup.libraries;
            return libraries && Type.isString(libraries[uri]) ? libraries[uri] : uri;
        }
        normalize(uri) {
            let ch = uri.substring(uri.length - 1);
            switch (ch) {
                case '/':
                    return uri;
                case '#':
                    uri = uri.substring(0, uri.length - 1);
                    break;
                default:
                    break;
            }
            let index = uri.indexOf('?');
            if (index >= 2) {
                if (uri.substr(index - 3, 3) !== '.js') {
                    return uri.substring(0, index) + '.js' + uri.substring(index);
                }
            }
            else if (uri.substring(uri.length - 3) !== '.js') {
                return uri + '.js';
            }
            return uri;
        }
        invoke(url, reference, callback) {
            let references;
            if (Type.isArray(reference)) {
                references = reference;
            }
            else if (Type.isString(reference)) {
                references = new Array();
                references.push(reference);
            }
            else {
                throw 'argument type exception: reference.' + reference;
            }
            Assembly.loadFrom(this, url, references, (assembly) => {
                let dependencies = assembly.dependencies;
                let exports = new Array(dependencies.length);
                for (let i = 0; i < dependencies.length; i++) {
                    exports[i] = dependencies[i].exports;
                }
                if (callback != null) {
                    callback.apply(window, exports);
                }
            });
        }
        resolve(uri, refer = null) {
            let url;
            uri = this.parseLibrary(uri);
            uri = this.parsePaths(uri);
            uri = this.parseVars(uri);
            uri = this.normalize(uri);
            /* 46: .
             * 47: /
             */
            let first = uri.charCodeAt(0);
            if (Uri.isAbsoluteUrl(uri)) {
                url = uri;
            }
            else if (first === 46) {
                url = (refer != null ? Uri.getParent(refer.url) : this._baseUri) + uri.substring(2);
            }
            else if (first === 47) {
                let m = this._baseUri.match(AppDomain.ROOT_DIR_RE);
                url = m ? m[0] + uri.substring(1) : uri;
            }
            else {
                url = this._setup.baseUrl + uri;
            }
            return url;
        }
        getAssembly(url) {
            for (let assembly of this._assemblies) {
                if (assembly.url == url) {
                    return assembly;
                }
            }
            return null;
        }
        loadAssembly(url, callback) {
            let assembly = Assembly.load(this, url, callback);
            this._assemblies.push(assembly);
            return assembly;
        }
    }
    AppDomain.IGNORE_LOCATION_RE = /^(about|blob):/;
    AppDomain.ROOT_DIR_RE = /^.*?\/\/.*?\//;
    AppDomain.DIRNAME_RE = /[^?#]*\//;
    AppDomain.PATHS_RE = /^([^/:]+)(\/.+)$/;
    AppDomain.VARS_RE = /{([^{]+)}/g;
    function define(factory) {
        if (!Type.isFunction(factory)) {
            throw 'argument exception: factory';
        }
        let metadata = new AssemblyMetadata();
        metadata.factory = factory;
        metadata.references = Script.parseReferences(factory.toString());
        AppDomain.currentDomain.anonymousMetadata = metadata;
    }
    function config(setup) {
        if (setup == null)
            throw 'argument null exception: setup';
        if (setup.charset == null) {
            setup.charset = 'utf-8';
        }
        AppDomain.currentDomain = new AppDomain(setup);
    }
    akky.config = config;
    ;
    function run(reference, callback) {
        let appDomain = AppDomain.currentDomain;
        let url = appDomain.resolve('run_' + Assembly.creator());
        appDomain.invoke(url, reference, callback);
    }
    akky.run = run;
    ;
    window['define'] = define;
    let scripts = document.getElementsByTagName('script');
    for (let script of scripts) {
        if (script.src.indexOf('akky.js') >= 0) {
            let baseUrl = script.getAttribute('data-baseurl');
            if (baseUrl != null) {
                config({ baseUrl: baseUrl });
            }
            let mainScript = script.getAttribute('data-main');
            if (mainScript != null) {
                run(mainScript);
            }
            break;
        }
    }
})(akky || (akky = {}));
//# sourceMappingURL=akky.js.map