define((require) => {

    let system = require('./netcore/system');
    let generic = require('./netcore/system.collections.generic');
    let uiassembiles = require('./ui-assembiles');

    let EventDispatcher: system.EventDispatcherConstructor = system.EventDispatcher;
    let List: system.collections.generic.ListConstructor = generic.List;
    let Dictionary: system.collections.generic.DictionaryConstructor = generic.Dictionary;

    let UIMemberTypes: uiassembiles.UIMemberTypesConstructor = uiassembiles.UIMemberTypes;
    let UIRelativeSource: uiassembiles.UIRelativeSourceConstructor = uiassembiles.UIRelativeSource;

    interface ValueType {
        name: string;
        min: number;
        max: number;
    }
    let valueTypes: Array<ValueType> = [
        { name: 'System.Byte', min: 0, max: 255 },
        { name: 'System.SByte', min: -128, max: 127 },
        { name: 'System.Int16', min: -32768, max: 32767 },
        { name: 'System.UInt16', min: 0, max: 65535 },
        { name: 'System.Int32', min: -2147483648, max: 2147483647 },
        { name: 'System.UInt32', min: 0, max: 4294967295 },
        { name: 'System.Int64', min: -9223372036854775808, max: 9223372036854775807 },
        { name: 'System.UInt64', min: 0, max: 18446744073709551615 },
        { name: 'System.Float', min: -3.40282347E+38, max: 3.40282347E+38 },
        { name: 'System.Double', min: -1.7976931348623157E+308, max: 1.7976931348623157E+308 },
    ];

    enum StyleType {
        info,
        danger
    }
    class StyleManager {
        public static getStyle(type: StyleType): string {
            switch (type) {
                case StyleType.info:
                    return 'wui-btn wui-btn-default wui-btn-small';
                case StyleType.danger:
                    return 'wui-btn wui-btn-danger wui-btn-small';
                default:
                    throw 'unknown ButtonType:' + type;
            }
        }
    }
    class IdentityManager {
        private static _dictionary: system.collections.generic.Dictionary<uiassembiles.UIField, number> = new Dictionary<uiassembiles.UIField, number>();

        public static identity(field: uiassembiles.UIField): number {
            let dictionary = IdentityManager._dictionary;
            let value = dictionary.tryGetValue(field);
            if (value === undefined) {
                value = 1;
                dictionary.add(field, value);
            } else {
                value++;
                dictionary.update(field, value);
            }
            return value;
        }
        public static update(field: uiassembiles.UIField, value: number): void {
            let dictionary = IdentityManager._dictionary;
            let result = dictionary.tryGetValue(field);
            if (result === undefined) {
                dictionary.add(field, value);
            } else if (value > result) {
                dictionary.update(field, value);
            }
        }
    }

    abstract class Visual extends EventDispatcher {
        private _parent: Visual;

        public constructor(parent: Visual) {
            super();

            this._parent = parent;
        }

        public abstract get dom(): HTMLElement;
        public get parent(): Visual {
            return this._parent;
        }

        public static getContainer(visual: Visual): UIContainer {
            if (visual == null)
                throw 'argument null exception: visual';

            let parent = visual;
            while (parent.parent != null) {
                parent = parent.parent;
            }
            return <UIContainer>parent;
        }
        public abstract getValue(): any;
        public abstract setValue(value: any): void;
    }
    abstract class UIElement extends Visual {
        public static readonly Changed = 'changed';

        private _type: uiassembiles.UIType;
        private _member: uiassembiles.UIMember;

        protected constructor(type: uiassembiles.UIType, member: uiassembiles.UIMember, parent: Visual) {
            if (type == null)
                throw 'argument null exception: type';
            if (member == null)
                throw 'argument null exception: member';

            super(parent);
            this._type = type;
            this._member = member;
        }

        public get type(): uiassembiles.UIType {
            return this._type;
        }
        public get member(): uiassembiles.UIMember {
            return this._member;
        }
        public get isElement(): boolean {
            if (this.parent instanceof Control) {
                let element = <Control>this.parent;
                return element.template instanceof ArrayDataTemplate;
            }
            return false;
        }
    }
    abstract class FrameworkElement extends UIElement {
        public static readonly DataContextChanged = 'data-context-changed';
        private _dataContext: any;
        private _dataBinding: DataBinding;
        private _itemDataBinding: DataBinding;

        protected constructor(type: uiassembiles.UIType, member: uiassembiles.UIMember, parent: Visual) {
            super(type, member, parent);
            if (member.memberType === UIMemberTypes.field) {
                let field = <uiassembiles.UIField>member;
                if (field.dataBinding != null) {
                    this._dataBinding = DataBinding.lookupConstructor(field.dataBinding, this);
                }
                if (field.itemDataBinding != null) {
                    this._itemDataBinding = DataBinding.lookupConstructor(field.itemDataBinding, this);
                }
            }
        }

        public get dataContext(): any {
            return this._dataContext;
        }
        public set dataContext(value: any) {
            this._dataContext = value;
            this.dispatchEventWith(FrameworkElement.DataContextChanged, this);
        }
        public get dataBinding(): DataBinding {
            if (this.isElement) {
                let element = <FrameworkElement>this.parent;
                return element._itemDataBinding;
            }
            return this._dataBinding;
        }
    }
    class Control extends FrameworkElement {
        private _template: DataTemplate;

        public constructor(type: uiassembiles.UIType, member: uiassembiles.UIMember, parent: Visual) {
            super(type, member, parent);
            if (member.memberType === UIMemberTypes.field) {
                let field = <uiassembiles.UIField>member;
                if (field.dataTemplate != null) {
                    switch (field.dataTemplate.fullName) {
                        case 'UIAssemblies.DataTemplates.TextareaDataTemplate':
                            this._template = new TextareaDataTemplate(this);
                            break;
                    }
                }
            }
            if (this._template === undefined) {
                if (this.dataBinding === undefined) {
                    this._template = DataTemplate.lookupConstructor(this);
                } else {
                    this._template = this.applyTemplate();
                }
            }
        }

        public get template(): DataTemplate {
            return this._template;
        }
        public get dom(): HTMLElement {
            return this._template.dom;
        }

        public static lookupConstructor(member: uiassembiles.UIMember, parent: Visual = null): Control {
            if (member == null)
                throw 'argument null exception: member';

            let type: uiassembiles.UIType;
            switch (member.memberType) {
                case UIMemberTypes.typeInfo:
                case UIMemberTypes.nestedType:
                    type = <uiassembiles.UIType>member;
                    break;
                case UIMemberTypes.field:
                    type = (<uiassembiles.UIField>member).fieldType;
                    break;
                default:
                    throw 'unknown memberType: ' + member.memberType;
            }
            return new Control(type, member, parent);
        }

        protected applyTemplate(): DataTemplate {
            if (this.dataBinding !== undefined) {
                return new SelectContextDataTemplate(this);
            }
            return undefined;
        }

        public getValue(): any {
            return this._template.getValue();
        }
        public setValue(value: any): void {
            this._template.setValue(value);
        }
    }

    abstract class DataBinding extends EventDispatcher {
        public static readonly SourceUpdated = 'source_updated';
        private _metadata: uiassembiles.UIDataBinding;

        public constructor(metadata: uiassembiles.UIDataBinding) {
            if (metadata == null)
                throw 'argument null exception: metadata';

            super();
            this._metadata = metadata;
        }

        public get metadata(): uiassembiles.UIDataBinding {
            return this._metadata;
        }

        public static lookupConstructor(metadata: uiassembiles.UIDataBinding, sourceElement: FrameworkElement): DataBinding {
            if (metadata == null)
                throw 'argument null exception: metadata';
            if (sourceElement == null)
                throw 'argument null exception: sourceElement';

            if (metadata.source != null) {
                let type = metadata.source;
                switch (type.fullName) {
                    default:
                        throw 'unknown DataContext: ' + type.fullName;
                }
            }
            switch (metadata.relativeSource) {
                case UIRelativeSource.none:
                    return new ContextDataBinding(metadata, sourceElement);
                default:
                    return new TemplateDataBinding(metadata, sourceElement);
            }
        }

        public abstract getData(): system.collections.generic.IReadOnlyDictionary<string, any>;
    }
    class ContextDataBinding extends DataBinding {
        private _sourceElement: FrameworkElement;

        public constructor(metadata: uiassembiles.UIDataBinding, sourceElement: FrameworkElement) {
            super(metadata);
            this._sourceElement = sourceElement;
            this._sourceElement.addEventListener(FrameworkElement.DataContextChanged, this.onSourceChanged, this);
        }

        private onSourceChanged(e: system.Event): void {
            this.dispatchEventWith(DataBinding.SourceUpdated);
        }

        public getData(): system.collections.generic.IReadOnlyDictionary<string, any> {
            let obj = this._sourceElement.dataContext;
            if (obj == null) {
                let parent = this._sourceElement.parent;
                while (parent instanceof FrameworkElement) {
                    obj = parent.dataContext;
                    if (obj != null) break;
                    else parent = parent.parent;
                }
            }
            if (obj != null && this.metadata.path !== undefined) {
                let name: string;
                let paths = this.metadata.path.split('.');
                for (let i = 0; i < paths.length; i++) {
                    name = paths[i];
                    if (name in obj) {
                        obj = obj[name];
                    } else {
                        obj = null;
                        break;
                    }
                }
            }
            let dictionary = new Dictionary<string, any>();
            if (obj instanceof Array) {
                let key: string;
                let value: any;
                let array = <Array<any>>obj;
                let display = this.metadata.display !== undefined ? this.metadata.display : this.metadata.element;
                for (let item of array) {
                    key = <string>item[display];
                    value = item[this.metadata.element];
                    dictionary.add('[' + value + '] ' + (key || ''), value);
                }
            }
            return dictionary;
        }
    }
    class TemplateDataBinding extends DataBinding {
        private _targetElement: UIElement;

        public constructor(metadata: uiassembiles.UIDataBinding, sourceElement: FrameworkElement) {
            super(metadata);
            let targetElement: FrameworkElement;
            switch (metadata.relativeSource) {
                case UIRelativeSource.template:
                case UIRelativeSource.self:
                    if (metadata.relativeSource === UIRelativeSource.template) {
                        let container = Visual.getContainer(sourceElement);
                        targetElement = container.entryPoint;
                    } else {
                        targetElement = sourceElement;
                    }
                    break;
                case UIRelativeSource.findAncestor:
                    let parent: FrameworkElement;
                    let ancestorType = metadata.ancestorType;
                    let ancestorLevel = metadata.ancestorLevel;
                    let parentVisual = sourceElement.parent;
                    while (parentVisual != null && parentVisual instanceof FrameworkElement) {
                        parent = <FrameworkElement>parentVisual;
                        if (ancestorType === undefined) {
                            ancestorLevel--;
                        } else if (parent.member.name === ancestorType.fullName) {
                            ancestorLevel--;
                        }
                        if (ancestorLevel <= 0) {
                            targetElement = parent;
                            break;
                        }

                        parentVisual = parent.parent;
                    }
                    if (targetElement === undefined) {
                        throw 'binding exception: ancestor not found.';
                    }
                    break;
                default:
                    throw 'binding exception: unknown UIRelativeSource: ' + metadata.relativeSource;
            }
            if (metadata.path !== undefined) {
                if (!(targetElement instanceof Control))
                    throw 'binding exception: targetElement type error.';

                let template: ClassDataTemplate;
                let child = <Control>targetElement;
                let paths = metadata.path.split('.');
                for (let i = 0; i < paths.length; i++) {
                    if (!(child.template instanceof ClassDataTemplate)) {
                        throw 'binding exception: invalid binding path: ' + metadata.path;
                    }

                    template = <ClassDataTemplate>child.template;
                    child = template.getProperty(paths[i]);
                    if (child == null) {
                        throw 'binding exception: invalid binding path: ' + metadata.path;
                    }
                }
                targetElement = child;
            }
            this._targetElement = targetElement;
            this._targetElement.addEventListener(UIElement.Changed, this.onSourceChanged, this);
        }

        private onSourceChanged(e: system.Event): void {
            this.dispatchEventWith(DataBinding.SourceUpdated);
        }

        public getData(): system.collections.generic.IReadOnlyDictionary<string, any> {
            let key: string;
            let value: any;
            let dictionary = new Dictionary<string, any>();
            let array = <Array<any>>this._targetElement.getValue();
            let display = this.metadata.display !== undefined ? this.metadata.display : this.metadata.element;
            for (let item of array) {
                key = <string>item[display];
                value = item[this.metadata.element];
                dictionary.add('[' + value + '] ' + (key || ''), value);
            }
            return dictionary;
        }
    }

    abstract class DataTemplate extends EventDispatcher {
        private _templateParent: FrameworkElement;

        public constructor(templateParent: FrameworkElement) {
            if (templateParent == null)
                throw 'argument null exception: templateParent';

            super();
            this._templateParent = templateParent;
        }

        public abstract get dom(): HTMLElement;
        public get templateParent(): FrameworkElement {
            return this._templateParent;
        }

        public static lookupConstructor(parent: FrameworkElement): DataTemplate {
            if (parent == null)
                throw 'argument null exception: control';

            switch (parent.type.fullName) {
                case 'System.Byte':
                case 'System.SByte':
                case 'System.Int16':
                case 'System.UInt16':
                case 'System.Int32':
                case 'System.UInt32':
                case 'System.Int64':
                case 'System.UInt64':
                case 'System.Float':
                case 'System.Double':
                case 'System.String':
                //case 'System.TimeSpan':
                case 'System.DateTime':
                    return new ValueDataTemplate(parent);
                case 'System.Boolean':
                    return new BooleanDataTemplate(parent);
                case 'System.TimeSpan':
                    return new TimeSpanDataTemplate(parent);
                default:
                    if (parent.type.isEnum) {
                        return new EnumDataTemplate(parent);
                    } else if (parent.type.isArray) {
                        return new ArrayDataTemplate(parent);
                    } else if (parent.type.isGenericType && !parent.type.isGenericTypeDefinition) {
                        let definitionType = parent.type.genericTypeDefinition;
                        switch (definitionType.fullName) {
                            case 'System.Collections.Generic.List`1':
                                return new ArrayDataTemplate(parent);
                        }
                    }

                    return new ClassDataTemplate(parent);
            }
        }
        public abstract getValue(): any;
        public abstract setValue(value: any): void;
    }
    class SelectContextDataTemplate extends DataTemplate {
        private _dom: HTMLSelectElement;

        public constructor(templateParent: FrameworkElement) {
            super(templateParent);

            this._dom = document.createElement('select');
            this._dom.className = 'wui-select';
            this._dom.addEventListener('change', (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();

                this.templateParent.dispatchEventWith(UIElement.Changed);
            });
            this.updateSourceElement();
            this.templateParent.dataBinding.addEventListener(DataBinding.SourceUpdated, this.onSourceUpdated, this);
        }

        public get dom(): HTMLElement {
            return this._dom;
        }

        private updateSourceElement(): void {
            let oldval = this._dom.value;
            let dictionary = this.templateParent.dataBinding.getData();
            this._dom.options.length = 0;
            for (let entity of dictionary) {
                let option = document.createElement('option');
                option.value = entity.value;
                option.innerHTML = entity.key;
                this._dom.options.add(option);
            }
            this._dom.value = oldval;
        }
        private onSourceUpdated(): void {
            this.updateSourceElement();
        }

        public getValue() {
            return Number(this._dom.value);
        }
        public setValue(value: any): void {
            this._dom.value = value;
        }
    }

    class ExtendMenuItem extends EventDispatcher {
        public static readonly Click = 'click';
        private _dom: HTMLDivElement;

        public constructor() {
            super();

            this._dom = document.createElement('div');
            this._dom.className = 'aui-extend-menu-option';
            this._dom.addEventListener('click', (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.dispatchEventWith(ExtendMenuItem.Click);
            });
        }

        public get dom(): HTMLElement {
            return this._dom;
        }
        public get header(): string {
            return this._dom.innerHTML;
        }
        public set header(value: string) {
            this._dom.innerHTML = value;
        }
    }
    class ExtendMenu {
        private _dom: HTMLDivElement;
        private _header: HTMLDivElement;
        private _container: HTMLDivElement;
        private _items: Array<ExtendMenuItem>;

        public constructor(items?: Iterable<ExtendMenuItem>) {
            this._dom = document.createElement('div');
            this._dom.className = 'aui-extend-menu';

            this._header = document.createElement('div');
            this._header.className = 'aui-extend-menu-header';
            this._dom.appendChild(this._header);

            this._container = document.createElement('div');
            this._container.className = 'aui-extend-menu-options';
            this._dom.appendChild(this._container);

            this._items = new Array<ExtendMenuItem>();
            if (items != null) {
                for (let item of items) {
                    this._items.push(item);
                    this._container.appendChild(item.dom);
                }
            }
        }

        public get dom(): HTMLElement {
            return this._dom;
        }
    }

    class ValueDataTemplate extends DataTemplate {
        private _dom: HTMLInputElement;
        private _valueType: ValueType;

        public constructor(templateParent: FrameworkElement) {
            super(templateParent);

            this._dom = document.createElement('input');
            this._dom.className = 'wui-input';
            this._dom.addEventListener('change', (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();

                this.templateParent.dispatchEventWith(UIElement.Changed);
            });
            let type = templateParent.type;
            let member = templateParent.member;
            this._valueType = valueTypes.find(p => p.name == type.fullName);
            if (member.memberType === UIMemberTypes.field) {
                let field = <uiassembiles.UIField>member;
                if (field.tooltip !== undefined) {
                    this._dom.title = field.tooltip;
                }
            }
            if (this._valueType != null) {
                this._dom.type = 'number';
                this._dom.min = this._valueType.min.toString();
                this._dom.max = this._valueType.max.toString();
                if (member.memberType === UIMemberTypes.field) {
                    let field = <uiassembiles.UIField>member;
                    if (field.identity) {
                        this._dom.readOnly = true;
                        this._dom.value = IdentityManager.identity(field).toString();
                    } else {
                        this._dom.value = field.default !== undefined ? field.default : 0;
                    }
                }
            } else {
                switch (type.fullName) {
                    case 'System.String':
                        this._dom.type = 'text';
                        break;
                    case 'System.TimeSpan':
                        this._dom.type = 'time';
                        break;
                    case 'System.DateTime':
                        this._dom.type = 'datetime';
                        break;
                    default:
                        throw 'unknown fieldType: ' + type.fullName;
                }
            }
        }

        public get dom(): HTMLElement {
            return this._dom;
        }

        public getValue(): any {
            if (this._valueType != null) {
                return Number(this._dom.value);
            } else {
                return this._dom.value;
            }
        }
        public setValue(value: any): void {
            this._dom.value = value;
            if (this.templateParent.member.memberType === UIMemberTypes.field) {
                let field = <uiassembiles.UIField>this.templateParent.member;
                if (field.identity) {
                    IdentityManager.update(field, <number>value);
                }
            }
        }
    }
    class TextareaDataTemplate extends DataTemplate {
        private _dom: HTMLTextAreaElement;

        public constructor(templateParent: FrameworkElement) {
            super(templateParent);

            this._dom = document.createElement('textarea');
            this._dom.className = 'wui-textarea';
            this._dom.addEventListener('change', (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();

                this.templateParent.dispatchEventWith(UIElement.Changed);
            });
        }

        public get dom(): HTMLElement {
            return this._dom;
        }

        public getValue(): any {
            return this._dom.value;
        }
        public setValue(value: any): void {
            this._dom.value = value;
        }
    }
    class TimeSpanDataTemplate extends DataTemplate {
        private static readonly defaultType = 'HH:mm:ss';
        private static readonly standardType = 'ddd.HH:mm:ss';

        private _dom: HTMLDivElement;
        private _dayInput: HTMLInputElement;
        private _daySeparator: HTMLLabelElement;
        private _hourInput: HTMLInputElement;
        private _hourSeparator: HTMLLabelElement;
        private _minuteInput: HTMLInputElement;
        private _minuteSeparator: HTMLLabelElement;
        private _secondInput: HTMLInputElement;
        private _secondSeparator: HTMLLabelElement;
        private _millisecondInput: HTMLInputElement;
        private _type: string;

        public constructor(templateParent: FrameworkElement) {
            super(templateParent);

            this._dom = document.createElement('div');
            this._dom.className = 'aui-timespan';

            this._dayInput = document.createElement('input');
            this._hourInput = document.createElement('input');
            this._minuteInput = document.createElement('input');
            this._secondInput = document.createElement('input');
            this._millisecondInput = document.createElement('input');

            this._daySeparator = document.createElement('label');
            this._hourSeparator = document.createElement('label');
            this._minuteSeparator = document.createElement('label');
            this._secondSeparator = document.createElement('label');

            let options = [
                { element: this._dayInput, width: '27px', value: '000', maxLength: 3, min: 0, max: 999 },
                { element: this._hourInput, width: '18px', value: '00', maxLength: 2, min: 0, max: 23 },
                { element: this._minuteInput, width: '18px', value: '00', maxLength: 2, min: 0, max: 59 },
                { element: this._secondInput, width: '18px', value: '00', maxLength: 2, min: 0, max: 59 },
                { element: this._millisecondInput, width: '27px', value: '000', maxLength: 3, min: 0, max: 999 },
            ];
            let element: HTMLInputElement;
            for (let option of options) {
                element = option.element;
                element.style.width = option.width;
                element.type = 'text';
                element.value = option.value;
                element.maxLength = option.maxLength;
                element.addEventListener('dragstart', (e) => {
                    e.stopImmediatePropagation();
                    e.stopPropagation();

                    return false;
                });
                //element.addEventListener('click', (e) => {
                //    e.stopImmediatePropagation();
                //    e.stopPropagation();
                //});
                element.addEventListener('focus', (e) => {
                    e.stopImmediatePropagation();
                    e.stopPropagation();

                    if (!this._dom.classList.contains('aui-timespan-active')) {
                        this._dom.classList.add('aui-timespan-active');
                    }
                    let srcElement = <HTMLInputElement>e.srcElement;
                    srcElement.select();
                    srcElement.focus({ preventScroll: true });
                });
                element.addEventListener('blur', (e) => {
                    e.stopImmediatePropagation();
                    e.stopPropagation();

                    if (this._dom.classList.contains('aui-timespan-active')) {
                        this._dom.classList.remove('aui-timespan-active');
                    }
                    let srcElement = <HTMLInputElement>e.srcElement;
                    for (let i = srcElement.value.length; i < srcElement.maxLength; i++) {
                        srcElement.value = '0' + srcElement.value;
                    }
                });
                element.addEventListener('input', (e) => {
                    e.stopImmediatePropagation();
                    e.stopPropagation();

                    let srcElement = <HTMLInputElement>e.srcElement;
                    let value = parseInt(srcElement.value);
                    if (value < option.min || value > option.max) {
                        srcElement.value = '';
                        for (let i = 0; i < srcElement.maxLength; i++) {
                            srcElement.value += '0';
                        }
                        srcElement.select();
                        srcElement.focus();
                    }

                    this.templateParent.dispatchEventWith(UIElement.Changed);
                });
            }

            this._daySeparator.innerHTML = '.';
            this._hourSeparator.innerHTML = ':';
            this._minuteSeparator.innerHTML = ':';
            this._secondSeparator.innerHTML = '.';

            this.updateLayout(TimeSpanDataTemplate.defaultType);
        }

        public get dom(): HTMLElement {
            return this._dom;
        }

        private updateLayout(type: string): void {
            this._type = type;

            let child: HTMLElement;
            while (this._dom.children.length > 0) {
                child = <HTMLElement>this._dom.children.item(0);
                this._dom.removeChild(child);
            }

            if (type.indexOf('ddd') >= 0) {
                this._dom.appendChild(this._dayInput);
                this._dom.appendChild(this._daySeparator);
            }
            this._dom.appendChild(this._hourInput);
            this._dom.appendChild(this._hourSeparator);
            this._dom.appendChild(this._minuteInput);

            if (type.indexOf('ddd') >= 0 || type.indexOf('ss') >= 0) {
                this._dom.appendChild(this._minuteSeparator);
                this._dom.appendChild(this._secondInput);
                if (type.indexOf('fff') >= 0) {
                    this._dom.appendChild(this._secondSeparator);
                    this._dom.appendChild(this._millisecondInput);
                }
            }
        }

        public getValue(): any {
            return this._type
                .replace('ddd', this._dayInput.value == 'NaN' ? '000' : this._dayInput.value)
                .replace('HH', this._hourInput.value)
                .replace('mm', this._minuteInput.value)
                .replace('ss', this._secondInput.value == 'NaN' ? '00' : this._secondInput.value)
                .replace('fff', this._millisecondInput.value == 'NaN' ? '000' : this._millisecondInput.value);
        }
        public setValue(value: any): void {
            let reg = new RegExp('^((?<day>\\d+)[\\.,\\s])?(?<hour>\\d+):(?<minutes>\\d+)(:(?<seconds>\\d+))?(\\.(?<milliseconds>\\d+))?$');
            let result = reg.exec(value.trim());
            if (result == null) {
                throw 'TimeSpan format error: ' + value;
            }

            let days = 0;
            let hours = 0;
            let minutes = 0;
            let seconds = 0;
            let milliseconds = 0;
            let groups = result['groups'];
            for (let key in groups) {
                switch (key) {
                    case 'day':
                        days = parseInt(groups[key]);
                        break;
                    case 'hour':
                        hours = parseInt(groups[key]);
                        break;
                    case 'minutes':
                        minutes = parseInt(groups[key]);
                        break;
                    case 'seconds':
                        seconds = parseInt(groups[key]);
                        break;
                    case 'milliseconds':
                        milliseconds = parseInt(groups[key]);
                        break;
                }
            }

            let normalizing = (v: number, len: number) => {
                let vt = v.toString();
                for (let i = vt.length; i < len; i++) {
                    vt = '0' + vt;
                }
                return vt;
            };
            this._dayInput.value = normalizing(days, 3);
            this._hourInput.value = normalizing(hours, 2);
            this._minuteInput.value = normalizing(minutes, 2);
            this._secondInput.value = normalizing(seconds, 2);
            this._millisecondInput.value = normalizing(milliseconds, 3);
        }
    }
    class EnumDataTemplate extends DataTemplate {
        private _dom: HTMLSelectElement;

        public constructor(templateParent: FrameworkElement) {
            super(templateParent);

            this._dom = document.createElement('select');
            this._dom.className = 'wui-select';
            this._dom.addEventListener('change', (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();

                this.templateParent.dispatchEventWith(UIElement.Changed);
            });
            for (let value of templateParent.type.getFields()) {
                let option = document.createElement('option');
                option.value = value.default;
                option.innerHTML = value.display != null ? value.display : value.name;
                this._dom.options.add(option);
            }
        }

        public get dom(): HTMLElement {
            return this._dom;
        }

        public getValue(): any {
            return Number(this._dom.value);
        }
        public setValue(value: any): void {
            this._dom.value = value;
        }
    }
    class BooleanDataTemplate extends DataTemplate {
        private _dom: HTMLDivElement;
        private _input: HTMLInputElement;

        public constructor(templateParent: FrameworkElement) {
            super(templateParent);

            this._dom = document.createElement('div');
            this._dom.className = 'wui-checkbox';

            let key = '__' + this.newGuid();
            this._input = document.createElement('input');
            this._input.id = key;
            this._input.type = 'checkbox';
            this._input.addEventListener('click', (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();

                this.templateParent.dispatchEventWith(UIElement.Changed);
            });
            this._dom.appendChild(this._input);

            let label = document.createElement('label');
            label.htmlFor = key;
            this._dom.appendChild(label);
        }

        public get dom(): HTMLDivElement {
            return this._dom;
        }

        private newGuid(): string {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        public getValue() {
            return this._input.checked;
        }
        public setValue(value: any): void {
            this._input.checked = value;
        }
    }
    class ClassDataTemplate extends DataTemplate {
        private _subclass: uiassembiles.UIType;
        private _children: Array<Control> = new Array<Control>();
        private _items: Array<HTMLElement> = new Array<HTMLElement>();
        private _dom: HTMLDivElement;
        private _createButtons: Array<HTMLAnchorElement> = new Array<HTMLAnchorElement>();
        private _deleteButtons: Array<HTMLAnchorElement> = new Array<HTMLAnchorElement>();
        private _head: HTMLDivElement;
        private _body: HTMLDivElement;
        private _value: object;

        public constructor(templateParent: FrameworkElement) {
            super(templateParent);

            let panel = document.createElement('div');
            panel.className = 'aui-class';

            let isContainerOpened = false;
            let head = document.createElement('div');
            head.className = 'aui-class-head';
            head.addEventListener('dblclick', (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                if (this._subclass != null) {
                    if (isContainerOpened) {
                        isContainerOpened = false;
                        body.style.display = null;
                    } else {
                        isContainerOpened = true;
                        body.style.display = 'none';
                    }
                }
            });
            panel.appendChild(head);

            let body = document.createElement('div');
            body.className = 'aui-class-body';
            panel.appendChild(body);

            let button: HTMLAnchorElement;
            if (this.isDynamic) {
                body.style.display = 'none';

                let display: string;
                let field = <uiassembiles.UIField>this.templateParent.member;
                for (let type of field.selector) {
                    display = type.display === undefined ? type.name : type.display;
                    button = this.createButtion(display, StyleType.info, (e) => {
                        e.stopImmediatePropagation();
                        e.stopPropagation();

                        let subclass = type;
                        this.createSubclass(subclass);
                    });
                    button.style.marginRight = '5px';
                    this._createButtons.push(button);
                    head.appendChild(button);
                }
                button = this.createButtion('删除', StyleType.danger, (e) => {
                    e.stopImmediatePropagation();
                    e.stopPropagation();

                    this.createSubclass(null);
                });
                this._deleteButtons.push(button);
            } else {
                let type = templateParent.type;
                let title = document.createElement('span');
                title.className = 'aui-class-title';
                title.innerHTML = type.display !== undefined ? type.display : type.name;
                head.appendChild(title);
            }

            this._dom = panel;
            this._head = head;
            this._body = body;
            this.templateParent.addEventListener(FrameworkElement.DataContextChanged, this.onDataContextChanged, this);
            if (!this.isDynamic) {
                this.createSubclass(this.templateParent.type);
            }
        }

        public get dom(): HTMLElement {
            return this._dom;
        }
        public get isDynamic(): boolean {
            return this.templateParent.member.memberType === UIMemberTypes.field && (<uiassembiles.UIField>this.templateParent.member).selector !== undefined;
        }

        private onDataContextChanged(e: system.Event): void {
            for (let child of this._children) {
                child.dispatchEventWith(FrameworkElement.DataContextChanged, this);
            }
        }
        private onContentChanged(e: system.Event): void {
            this.templateParent.dispatchEventWith(UIElement.Changed);
        }

        private createButtion(name: string, style: StyleType, listener: (e: MouseEvent) => void): HTMLAnchorElement {
            let anchor = document.createElement('a');
            anchor.className = StyleManager.getStyle(style);
            anchor.href = 'javascript: void(0);';
            anchor.innerHTML = name;
            anchor.style.minWidth = '60px';
            anchor.addEventListener('click', listener);
            return anchor;
        }
        private findSubclass(name: string): uiassembiles.UIType {
            let field = <uiassembiles.UIField>this.templateParent.member;
            for (let type of field.selector) {
                if (type.name === name) {
                    return type;
                }
            }
            return null;
        }
        private createSubclass(type: uiassembiles.UIType): void {
            if (type == null) {
                if (this._subclass != null) {
                    for (let item of this._items) {
                        this._body.removeChild(item);
                    }
                    for (let child of this._children) {
                        child.removeEventListener(UIElement.Changed, this.onContentChanged);
                    }
                    this._items.splice(0, this._items.length);
                    this._children.splice(0, this._children.length);
                    for (let button of this._deleteButtons) {
                        this._head.removeChild(button);
                    }
                    for (let button of this._createButtons) {
                        this._head.appendChild(button);
                    }
                    this._body.style.display = 'none';
                }
            } else {
                for (let button of this._createButtons) {
                    this._head.removeChild(button);
                }
                for (let button of this._deleteButtons) {
                    this._head.appendChild(button);
                }

                let uiElement: Control;
                for (let field of type.getFields()) {
                    uiElement = Control.lookupConstructor(field, this.templateParent);
                    uiElement.addEventListener(UIElement.Changed, this.onContentChanged, this);
                    this._children.push(uiElement);

                    let item = document.createElement('div');
                    item.className = 'aui-auto-row';

                    let head = document.createElement('span');
                    head.className = 'aui-auto-row-title';
                    head.innerHTML = (field.display !== undefined ? field.display : field.name) + ': ';
                    item.appendChild(head);

                    let content = uiElement.dom;
                    content.classList.add('aui-auto-row-content');
                    item.appendChild(content);

                    this._items.push(item);
                    this._body.appendChild(item);
                }

                this._body.style.display = null;
            }

            this._subclass = type;
        }

        public getProperty(name: string): Control {
            if (name == null)
                throw 'argument null exception: name';

            for (let element of this._children) {
                if (element.member.name === name) {
                    return element;
                }
            }
            return null;
        }
        public getValue(): any {
            if (this._subclass == null) {
                return null;
            }

            let obj = this._value || (this._value = {});
            for (let child of this._children) {
                obj[child.member.name] = child.getValue();
            }
            if (this.isDynamic) {
                obj['ClassName'] = this._subclass.name;
            }
            return obj;
        }
        public setValue(value: any): void {
            this._value = value;
            if (value == null) {
                this.createSubclass(null);
                return;
            }
            if (this._subclass == null) {
                if (this.isDynamic) {
                    let name = <string>value['ClassName'];
                    let type = this.findSubclass(name);
                    this.createSubclass(type);
                } else {
                    this.createSubclass(this.templateParent.type);
                }
            }
            for (let child of this._children) {
                if (child.member.name in value) {
                    child.setValue(value[child.member.name]);
                }
            }
        }
    }
    class ArrayDataTemplate extends DataTemplate {
        private _items: system.collections.generic.List<Control> = new List<Control>();
        private _dom: HTMLDivElement;
        private _body: HTMLDivElement;

        public constructor(templateParent: FrameworkElement) {
            super(templateParent);

            this._dom = document.createElement('div');
            this._dom.className = 'aui-array';

            let isContainerOpened = false;
            let head = document.createElement('div');
            head.className = 'aui-array-head';
            head.addEventListener('dblclick', (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                if (this._items.count > 0) {
                    if (isContainerOpened) {
                        isContainerOpened = false;
                        this._body.style.display = null;
                    } else {
                        isContainerOpened = true;
                        this._body.style.display = 'none';
                    }
                }
            });
            this._dom.appendChild(head);

            this._body = document.createElement('div');
            this._body.className = 'aui-array-body';
            this._body.style.display = 'none';
            this._dom.appendChild(this._body);

            let button: HTMLAnchorElement;
            if (this.isDynamic) {
                let itemSelector = (<uiassembiles.UIField>templateParent.member).itemSelector;
                for (let i = 0; i < itemSelector.count; i++) {
                    let itemType = itemSelector.charAt(i);
                    let name = itemType.display != null ? itemType.display : itemType.name;
                    button = this.createButtion(name, StyleType.info, (e) => {
                        e.stopImmediatePropagation();
                        e.stopPropagation();

                        let item = Control.lookupConstructor(itemType, templateParent);
                        this.addItem(item);
                    });
                    button.style.marginRight = '5px';
                    head.appendChild(button);
                }
            } else {
                button = this.createButtion('创建', StyleType.info, (e) => {
                    e.stopImmediatePropagation();
                    e.stopPropagation();

                    let type = templateParent.type;
                    let itemType = type.isArray ? type.elementType : type.genericTypeArguments.charAt(0);
                    let item = Control.lookupConstructor(itemType, templateParent);
                    this.addItem(item);
                });
                button.style.marginRight = '5px';
                head.appendChild(button);
            }

            button = this.createButtion('清空', StyleType.danger, (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();

                this.clear();
            });
            head.appendChild(button);
        }

        public get dom(): HTMLElement {
            return this._dom;
        }
        public get isDynamic(): boolean {
            return this.templateParent.member.memberType === UIMemberTypes.field && (<uiassembiles.UIField>this.templateParent.member).itemSelector !== undefined;
        }
        public get items(): system.collections.generic.IReadOnlyList<Control> {
            return this._items;
        }

        private addItem(item: Control): void {
            if (this._items.count === 0) {
                this._body.style.display = null;
            }

            item.addEventListener(UIElement.Changed, this.itemChanged, this);

            this._body.appendChild(item.dom);
            this._items.add(item);
            this.templateParent.dispatchEventWith(UIElement.Changed);
        }
        private createButtion(name: string, style: StyleType, listener: (e: MouseEvent) => void): HTMLAnchorElement {
            let anchor = document.createElement('a');
            anchor.className = StyleManager.getStyle(style);
            anchor.href = 'javascript: void(0);';
            anchor.innerHTML = name;
            anchor.style.minWidth = '60px';
            anchor.addEventListener('click', listener);
            return anchor;
        }
        private findSubclass(name: string): uiassembiles.UIType {
            let field = <uiassembiles.UIField>this.templateParent.member;
            for (let type of field.itemSelector) {
                if (type.name === name) {
                    return type;
                }
            }
            return null;
        }
        private itemChanged(e: system.Event): void {
            this.templateParent.dispatchEventWith(UIElement.Changed);
        }

        public add(value: any): Control {
            if (value == null)
                throw 'argument null exception: value';

            let itemType: uiassembiles.UIType;
            if (this.isDynamic) {
                let classname = value['ClassName'];
                itemType = this.findSubclass(classname);
            } else {
                let type = this.templateParent.type;
                itemType = type.isArray ? type.elementType : type.genericTypeArguments.charAt(0);
            }

            let item = Control.lookupConstructor(itemType, this.templateParent);
            item.setValue(value);
            this.addItem(item);
            return item;
        }
        public remove(value: any): Control {
            for (let item of this._items) {
                if (item.getValue() === value) {
                    this._items.remove(item);
                    return item;
                }
            }
            return null;
        }
        public clear(): void {
            for (let item of this._items) {
                item.removeEventListener(UIElement.Changed, this.itemChanged);
                this._body.removeChild(item.dom);
            }

            this._items.clear();
            this._body.style.display = 'none';
            this.templateParent.dispatchEventWith(UIElement.Changed);
        }
        public getValue(): any {
            let array = new Array<object>();
            for (let item of this._items) {
                let obj = item.getValue();
                if (this.isDynamic) {
                    obj['ClassName'] = item.member.name;
                }
                array.push(obj);
            }
            return array;
        }
        public setValue(value: any): void {
            this.clear();
            let array = <Array<any>>value;
            for (let i = 0; i < array.length; i++) {
                this.add(array[i]);
            }
        }
    }

    class UIContainer extends Visual {
        private _assembly: uiassembiles.UIAssembly;
        private _entryPoint: Control;

        public constructor(assembly: uiassembiles.UIAssembly) {
            if (assembly == null)
                throw 'argument null exception: assembly';

            super(null);
            this._assembly = assembly;
            if (assembly.entryPoint != null) {
                this._entryPoint = Control.lookupConstructor(assembly.entryPoint, this);
            }
        }

        public get assembly(): uiassembiles.UIAssembly {
            return this._assembly;
        }
        public get entryPoint(): Control {
            return this._entryPoint;
        }
        public get dom(): HTMLElement {
            return this._entryPoint != null ? this._entryPoint.dom : undefined;
        }

        public getValue(): any {
            return this._entryPoint != null ? this._entryPoint.getValue() : null;
        }
        public setValue(value: any): void {
            if (this._entryPoint != null) {
                this._entryPoint.setValue(value);
            }
        }
    }

    return {
        UIElement: UIElement,
        Control: Control,
        UIContainer: UIContainer,
    };
});