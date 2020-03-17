namespace akky {
    interface IAppDomainSetup {
        isDebug?: boolean;
        baseUrl?: string;
        readonly paths?: object;
        readonly libraries?: object;
        readonly vars?: object;
        charset?: string;
        crossorigin?: string;
    }
    interface IEHTMLElement {
        readonly readyState: string;

        onreadystatechange: ((this: IEHTMLElement, ev: Event) => any) | null;
    }
    interface IModule {
        readonly url: string;
        exports: object;
    }

    export interface RequireEventHandler {
        (uri: string): any;

        resolve(uri: string): any;
        async(reference: string | Array<string>, callback?: Function): void;
    }
    declare type LoadAssemblyEventHandler = (assembly: Assembly) => void;
    export declare type DefineEventHandler = (require: RequireEventHandler, exports?: object, module?: IModule) => any;

    class Type {
        public static isType(obj: any, type: string): boolean {
            if (name == null)
                throw 'argument null exception: type';

            return {}.toString.call(obj) == '[object ' + type + ']';
        }

        public static isObject(obj: any): boolean {
            return Type.isType(obj, 'Object');
        }
        public static isString(obj: any): boolean {
            return Type.isType(obj, 'String');
        }
        public static isArray(obj: any): boolean {
            return Type.isType(obj, 'Array');
        }
        public static isFunction(obj: any): boolean {
            return Type.isType(obj, 'Function');
        }
        public static isUndefined(obj: any): boolean {
            return Type.isType(obj, 'Undefined');
        }
    }
    class Uri {
        private static readonly ABSOLUTE_RE = /^\/\/.|:\//;
        private static readonly PARENT_RE = /^.*?\/\/.*?\/(.*?\/)*/;
        private static readonly Separator = '/';
        private static readonly SchemeDelimiter = '://';

        public static combine(lh: string, rh: string) {
            if (lh == null || lh == '') return rh;
            if (rh == null || rh == '') return lh;
            if (lh.charAt(lh.length - 1) == Uri.Separator) lh = lh.substring(0, lh.length - 1);
            if (rh.charAt(0) != Uri.Separator) rh = Uri.Separator + rh;
            return lh + rh;
        }
        public static getParent(url: string): string {
            if (url == null || url == '') return url;
            let match = url.match(Uri.PARENT_RE);
            return match ? match[0] : url;
        }
        public static isAbsoluteUrl(url: string): boolean {
            return Uri.ABSOLUTE_RE.test(url);
        }
    }
    export class Script {
        private static readonly REQUIRE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*require|(?:^|[^$])\brequire\s*\(\s*(["'])(.+?)\1\s*\)/g;
        private static readonly SLASH_RE = /\\\\/g;
        public static readonly SCRIPT_LABEL_LIST_RE = /<script(.|\n)*?>(.|\n|\r\n)*?<\/script>/ig;
        public static readonly SCRIPT_LABEL_RE = /<script(.|\n)*?>((.|\n|\r\n)*)?<\/script>/im;

        public static parseReferences(code: string): Array<string> {
            let ret = new Array<string>();
            code.replace(Script.SLASH_RE, '')
                .replace(Script.REQUIRE_RE, function (m, m1, m2): string {
                    if (m2) {
                        ret.push(m2)
                    }
                    return '';
                });
            return ret
        }
        public static execScript(scriptText: string): any {
            if (scriptText == null)
                throw 'argument null exception: scriptText';

            if (window['execScript']) {
                return (<Function>window['execScript']).call(window, scriptText);
            } else {
                return eval(scriptText);
            }
        }
        public static getHtmlScript(html: string): Array<string> {
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
        public static execHtmlScript(html: string): void {
            if (html == null)
                throw 'argument null exception: html';

            let scriptTexts = Script.getHtmlScript(html);
            for (let scriptText of scriptTexts) {
                Script.execScript(scriptText);
            }
        }
    }

    enum AssemblyLoaderStatus {
        none,
        loading,
        success,
        error
    }
    class AssemblyLoader {
        private _assembly: Assembly;
        private _parent: HTMLElement;
        private _status: AssemblyLoaderStatus;
        private _callback: Function;

        public constructor(assembly: Assembly) {
            this._assembly = assembly;
            this._status = AssemblyLoaderStatus.none;
        }

        public get status(): AssemblyLoaderStatus {
            return this._status;
        }

        private onScriptCompleted(evt: Event): void {
            let node = <HTMLElement>(evt.currentTarget || evt.srcElement);
            if ('onload' in node) {
                node.onload = node.onerror = null;
            } else {
                let el = <IEHTMLElement>node;
                el.onreadystatechange = null;
            }

            this._parent.removeChild(node);
            this._callback.call(this);
        }
        private onScriptLoad(evt: Event): void {
            let readyRegExp = navigator.platform === 'PLAYSTATION 3' ? /^complete$/ : /^(complete|loaded)$/;
            if (evt.type === 'load' || (readyRegExp.test((evt.currentTarget || evt.srcElement)['readyState']))) {
                this._status = AssemblyLoaderStatus.success;
                this.onScriptCompleted(evt);
            }
        }
        private onScriptError(evt: Event): void {
            this._status = AssemblyLoaderStatus.error;
            this.onScriptCompleted(evt);
        }

        public load(callback: Function): void {
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
                node.onerror = e => this.onScriptError(<Event>e);
            } else {
                let el = <IEHTMLElement>node;
                el.onreadystatechange = e => {
                    if (/loaded|complete/.test(el.readyState)) {
                        this.onScriptLoad(e);
                    }
                }
            }

            this._parent = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
            this._status = AssemblyLoaderStatus.loading;
            this._parent.appendChild(node);
        }
    }

    enum AssemblyStatus {
        none,
        fetching,
        loading,
        loaded,
        executing,
        executed,
        error,
    }
    class Assembly {

        private static _maxid: number = 0;
        private _appDomain: AppDomain;
        private _status: AssemblyStatus;
        private _url: string;
        private _references: Array<string>;
        private _dependencies: Array<Assembly>;
        private _loadEvents: Array<LoadAssemblyEventHandler>;
        private _factory: DefineEventHandler;
        private _exports: object;

        private constructor(appDomain: AppDomain, url: string) {
            this._appDomain = appDomain;
            this._url = url;
            this._status = AssemblyStatus.none;
            this._loadEvents = new Array<LoadAssemblyEventHandler>();
        }

        public get appDomain(): AppDomain {
            return this._appDomain;
        }
        public get url(): string {
            return this._url;
        }
        public get references(): Array<string> {
            return this._references;
        }
        public get dependencies(): Array<Assembly> {
            return this._dependencies;
        }
        public get exports(): object {
            if (this._status == AssemblyStatus.error) {
                throw new Error('module was broken: ' + this._url);
            } else if (this._status < AssemblyStatus.loaded) {
                throw new Error('module not initialized: ' + this._url + '. status: ' + this._status);
            } else if (this._status == AssemblyStatus.loaded) {
                let mod = this;
                this._status = AssemblyStatus.executing;
                this._exports = new Object();
                if (this._factory != null) {
                    let require: any = function (uri: string): any {
                        let dependency = mod.getDependency(uri);
                        return dependency.exports;
                    }
                    require.url = this._url;
                    require.resolve = function (uri: string): string {
                        return mod.resolve(uri);
                    };
                    require.async = function (reference: string | Array<string>, callback?: Function): void {
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
        public set exports(value: object) {
            this._exports = value;
        }

        public static creator(): number {
            return ++Assembly._maxid;
        }
        public static load(appDomain: AppDomain, url: string, callback: LoadAssemblyEventHandler): Assembly {
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
                } else {
                    assembly._references = new Array<string>();
                }

                assembly._status = AssemblyStatus.none;
                assembly.loadCore(callback);
            });
            return assembly;
        }
        public static loadFrom(appDomain: AppDomain, url: string, references: Array<string>, callback: LoadAssemblyEventHandler): Assembly {
            let assembly = new Assembly(appDomain, url);
            assembly._references = references;
            assembly.loadCore(callback);
            return assembly;
        }

        private resolve(uri: string): string {
            return this._appDomain.resolve(uri, this);
        }
        private getDependency(uri: string): Assembly {
            let url = this.resolve(uri);
            for (let dependency of this._dependencies) {
                if (dependency.url == url) {
                    return dependency;
                }
            }
            throw 'dependency url: ' + url + ' not found.';
        }
        private doLoadCompleted(): void {
            this._status = AssemblyStatus.loaded;
            this.dispatchLoadEvent();
        }
        private dispatchLoadEvent(): void {
            for (let listener of this._loadEvents) {
                listener.call(this, this);
            }

            delete this._loadEvents;
        }

        protected loadCore(callback: LoadAssemblyEventHandler): void {
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
            this._dependencies = new Array<Assembly>(this._references.length);
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
                } else {
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
    class AssemblyMetadata {
        public references: Array<string>;
        public factory: DefineEventHandler;
    }
    class AppDomain {
        private static readonly IGNORE_LOCATION_RE = /^(about|blob):/;
        private static readonly ROOT_DIR_RE = /^.*?\/\/.*?\//;
        private static readonly DIRNAME_RE = /[^?#]*\//;
        private static readonly PATHS_RE = /^([^/:]+)(\/.+)$/;
        private static readonly VARS_RE = /{([^{]+)}/g;

        private static _currentDomain: AppDomain;
        private _setup: IAppDomainSetup;
        private _assemblies: Array<Assembly>;
        private _baseUri: string;

        public anonymousMetadata: AssemblyMetadata;

        public constructor(setup: IAppDomainSetup) {
            this._setup = setup;
            this._assemblies = new Array<Assembly>();
            this._baseUri = (!location.href || AppDomain.IGNORE_LOCATION_RE.test(location.href)) ? '' : this.dirname(location.href);
            if (!Uri.isAbsoluteUrl(setup.baseUrl)) {
                let first = setup.baseUrl.charCodeAt(0);
                switch (first) {
                    case 46:// .
                        setup.baseUrl = this._baseUri + setup.baseUrl.substring(2);
                        break;
                    case 47:// /
                        setup.baseUrl = location.origin + '/' + setup.baseUrl.substring(1);
                        break;
                    default:
                        setup.baseUrl = this._baseUri + setup.baseUrl;
                        break;
                }
            }
        }

        public static get currentDomain(): AppDomain {
            if (AppDomain._currentDomain == null) {
                AppDomain._currentDomain = new AppDomain({
                    baseUrl: '/'
                });
            }
            return AppDomain._currentDomain;
        }
        public static set currentDomain(value: AppDomain) {
            AppDomain._currentDomain = value;
        }
        public get setup(): IAppDomainSetup {
            return this._setup;
        }

        private dirname(path: string): string {
            return path.match(AppDomain.DIRNAME_RE)[0];
        }
        private parsePaths(uri: string): string {
            if (this._setup.paths) {
                let paths = this._setup.paths;
                let m = uri.match(AppDomain.PATHS_RE);
                if (m && Type.isString(paths[m[1]])) {
                    let lh = <string>paths[m[1]];
                    let rh = <string>m[2];
                    uri = (lh.charCodeAt(lh.length - 1) === 47 ? lh : lh + '/') + (rh.charCodeAt(0) === 47 ? rh.substring(1) : rh);
                }
            }
            return uri;
        }
        private parseVars(uri: string): string {
            let vars = this._setup.vars;
            if (vars && uri.indexOf('{') > -1) {
                uri = uri.replace(AppDomain.VARS_RE, (m, key) => {
                    return Type.isString(vars[key]) ? vars[key] : m;
                });
            }
            return uri;
        }
        private parseLibrary(uri: string): string {
            let libraries = this._setup.libraries;
            return libraries && Type.isString(libraries[uri]) ? libraries[uri] : uri;
        }
        private normalize(uri: string): string {
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
            } else if (uri.substring(uri.length - 3) !== '.js') {
                return uri + '.js';
            }
            return uri;
        }

        public invoke(url: string, reference: string | Array<string>, callback?: Function): void {
            let references: Array<string>;
            if (Type.isArray(reference)) {
                references = <Array<string>>reference;
            } else if (Type.isString(reference)) {
                references = new Array<string>();
                references.push(<string>reference);
            } else {
                throw 'argument type exception: reference.' + reference;
            }
            Assembly.loadFrom(this, url, references, (assembly) => {
                let dependencies = assembly.dependencies;
                let exports = new Array<object>(dependencies.length);
                for (let i = 0; i < dependencies.length; i++) {
                    exports[i] = dependencies[i].exports;
                }
                if (callback != null) {
                    callback.apply(window, exports);
                }
            });
        }

        public resolve(uri: string, refer: Assembly = null): string {
            let url: string;
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
            } else if (first === 46) {
                url = (refer != null ? Uri.getParent(refer.url) : this._baseUri) + uri.substring(2);
            } else if (first === 47) {
                let m = this._baseUri.match(AppDomain.ROOT_DIR_RE);
                url = m ? m[0] + uri.substring(1) : uri;
            } else {
                url = this._setup.baseUrl + uri;
            }
            return url;
        }

        public getAssembly(url: string): Assembly {
            for (let assembly of this._assemblies) {
                if (assembly.url == url) {
                    return assembly;
                }
            }
            return null;
        }

        public loadAssembly(url: string, callback: LoadAssemblyEventHandler): Assembly {
            let assembly = Assembly.load(this, url, callback);
            this._assemblies.push(assembly);
            return assembly;
        }
    }

    function define(factory: DefineEventHandler): void {
        if (!Type.isFunction(factory)) {
            throw 'argument exception: factory';
        }

        let metadata = new AssemblyMetadata();
        metadata.factory = factory;
        metadata.references = Script.parseReferences(factory.toString());
        AppDomain.currentDomain.anonymousMetadata = metadata;
    }

    export function config(setup: IAppDomainSetup): void {
        if (setup == null)
            throw 'argument null exception: setup';

        if (setup.charset == null) {
            setup.charset = 'utf-8';
        }

        AppDomain.currentDomain = new AppDomain(setup);
    };
    export function run(reference: string | Array<string>, callback?: Function): void {
        let appDomain = AppDomain.currentDomain;
        let url = appDomain.resolve('run_' + Assembly.creator());
        appDomain.invoke(url, reference, callback);
    };

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
}

declare function define(factory: akky.DefineEventHandler): void;