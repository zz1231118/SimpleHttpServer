define((require) => {
    let system = require('./netcore/system');
    let generic = require('./netcore/system.collections.generic');

    let Char: system.CharConstructor = system.Char;
    let List: system.collections.generic.ListConstructor = generic.List;
    let Dictionary: system.collections.generic.DictionaryConstructor = generic.Dictionary;

    class TextReader {
        private _text: string;
        private _position: number;

        public constructor(text: string) {
            if (text == null)
                throw 'argument null exception: text';

            this._text = text;
            this._position = 0;
        }

        public get endOfStream(): boolean {
            return this._position >= this._text.length;
        }

        public peek(offset: number = 0): string {
            if (this._position + offset >= this._text.length)
                throw 'end of stream';

            return this._text[this._position + offset];
        }
        public read(): string {
            if (this._position >= this._text.length)
                throw 'end of stream';

            return this._text[this._position++];
        }
    }
    class Tokenizer {
        private _reader: TextReader;

        public constructor(reader: TextReader) {
            if (reader == null)
                throw 'argument null exception: reader';

            this._reader = reader;
        }

        public get endOfStream(): boolean {
            return this._reader.endOfStream;
        }

        public peekChar(offset: number = 0): string {
            return this._reader.peek(offset);
        }
        public readChar(): string {
            return this._reader.read();
        }
        public readSymbol(): string {
            let ch = this._reader.read();
            if (!Char.isUnderline(ch) && !Char.isLetter(ch))
                throw 'invalid symbol char: ' + ch;

            let symbol = ch;
            while (!this.endOfStream) {
                ch = this._reader.peek();
                if (Char.isUnderline(ch) || Char.isNumber(ch) || Char.isLetter(ch)) {
                    symbol += this._reader.read();
                } else {
                    break;
                }
            }
            return symbol;
        }
        public readNumber(): number {
            let ch = this._reader.read();
            if (!Char.isNumber(ch))
                throw 'invalid number char: ' + ch;

            let symbol = ch;
            while (!this.endOfStream) {
                ch = this._reader.peek();
                if (Char.isNumber(ch)) {
                    symbol += this._reader.read();
                } else {
                    break;
                }
            }
            return parseInt(symbol);
        }
        public readGuid(): string {
            let ch = this._reader.read();
            if (!Char.isNumber(ch) && !Char.isLetter(ch))
                throw 'invalid guid char: ' + ch;

            let symbol = ch;
            while (!this.endOfStream) {
                ch = this._reader.peek();
                if (Char.isNumber(ch) || Char.isLetter(ch)) {
                    symbol += this._reader.read();
                } else {
                    break;
                }
            }
            return symbol;
        }
        public skipWhiteSpace(): void {
            let ch;
            while (!this.endOfStream) {
                ch = this._reader.peek();
                if (Char.isWhiteSpace(ch)) {
                    this._reader.read();
                } else {
                    break;
                }
            }
        }
        public maybeEat(text: string): boolean {
            if (text == null)
                throw 'argument null exception: text';

            let length = text.length;
            for (let i = 0; i < length; i++) {
                if (this._reader.peek(i) !== text[i]) {
                    return false;
                }
            }
            for (let i = 0; i < length; i++) {
                this._reader.read();
            }
            return true;
        }
    }
    class AssemblyReference {
        private _typeReference: TypeReference;
        private _assembly: string;
        private _version: string;
        private _culture: string;
        private _publicKeyToken: string;

        private constructor() {
        }

        public get fullName(): string {
            return this._typeReference.fullName + ', ' + this._assembly + ', Version=' + this._version + ', Culture=' + this._culture + ', PublicKeyToken=' + this.publicKeyToken;
        }
        public get typeReference(): TypeReference {
            return this._typeReference;
        }
        public get assembly(): string {
            return this._assembly;
        }
        public get version(): string {
            return this._version;
        }
        public get culture(): string {
            return this._culture;
        }
        public get publicKeyToken(): string {
            return this._publicKeyToken;
        }

        public static readFrom(tokenizer: Tokenizer): AssemblyReference {
            if (tokenizer == null)
                throw 'argument null exception: tokenizer';

            let assembly = new AssemblyReference();
            assembly._typeReference = TypeReference.readFrom(tokenizer);
            tokenizer.skipWhiteSpace();
            if (!tokenizer.maybeEat(','))
                throw 'assembly reference separator: ' + tokenizer.peekChar() + ' error.';

            tokenizer.skipWhiteSpace();
            assembly._assembly = tokenizer.readSymbol();
            let ch = tokenizer.peekChar();
            while (ch === '.') {
                assembly._assembly += tokenizer.readChar();
                assembly._assembly += tokenizer.readSymbol();
                ch = tokenizer.peekChar();
            }
            tokenizer.skipWhiteSpace();
            if (!tokenizer.maybeEat(','))
                throw 'assembly reference separator: ' + tokenizer.peekChar() + ' error.';

            tokenizer.skipWhiteSpace();
            if (!tokenizer.maybeEat('Version='))
                throw 'assembly version=: ' + tokenizer.peekChar() + ' error.';

            assembly._version = tokenizer.readNumber().toString();
            for (let i = 0; i < 3; i++) {
                if (!tokenizer.maybeEat('.'))
                    throw 'assembly version separator error.';

                assembly._version += '.';
                assembly._version += tokenizer.readNumber().toString();
            }

            tokenizer.skipWhiteSpace();
            if (!tokenizer.maybeEat(','))
                throw 'assembly reference separator: ' + tokenizer.peekChar() + ' error.';

            tokenizer.skipWhiteSpace();
            if (!tokenizer.maybeEat('Culture='))
                throw 'assembly culture=: ' + tokenizer.peekChar() + ' error.';

            assembly._culture = tokenizer.readSymbol();
            tokenizer.skipWhiteSpace();
            if (!tokenizer.maybeEat(','))
                throw 'assembly reference separator: ' + tokenizer.peekChar() + ' error.';

            tokenizer.skipWhiteSpace();
            if (!tokenizer.maybeEat('PublicKeyToken='))
                throw 'assembly publicKeyToken=: ' + tokenizer.peekChar() + ' error.';

            assembly._publicKeyToken = tokenizer.readGuid();
            return assembly;
        }
    }
    class TypeReference {
        private static readonly genericSeparatorChar = '`';
        private _name: string;
        private _fullName: string;
        private _isNested: boolean;
        private _isArray: boolean;
        private _isGenericType: boolean;
        private _genericArgumentLength: number;
        private _declaringType: TypeReference;
        private _elementType: TypeReference;
        private _genericTypeDefinition: TypeReference;
        private _genericTypeArguments: Array<AssemblyReference>;

        private constructor() {

        }

        public get name(): string {
            return this._name;
        }
        public get fullName(): string {
            let name: string;
            let assembiles = new List<AssemblyReference>();
            if (this._isGenericType && this._genericTypeArguments !== undefined) {
                assembiles.addRange(this._genericTypeArguments);
            }
            if (this._isNested) {
                name = this._name;
                let nestedType = this._declaringType;
                while (true) {
                    if (nestedType.isGenericType && nestedType._genericTypeArguments !== undefined) {
                        if (assembiles === undefined) {
                            assembiles = new List<AssemblyReference>();
                        }
                        for (let i = nestedType._genericTypeArguments.length - 1; i >= 0; i--) {
                            assembiles.insert(nestedType._genericTypeArguments[i], 0);
                        }
                    }
                    if (nestedType._isNested) {
                        name = nestedType._name + '+' + name;
                        nestedType = nestedType._declaringType;
                    } else {
                        name = nestedType._fullName + '+' + name;
                        break;
                    }
                }
            } else {
                name = this._fullName;
            }
            if (assembiles.count) {
                name += '[';
                let assembly: AssemblyReference;
                for (let i = 0; i < assembiles.count; i++) {
                    if (i > 0) {
                        name += ',';
                    }
                    assembly = assembiles.charAt(i);
                    name += '[' + assembly.fullName + ']';
                }

                name += ']';
            }
            return name;
        }
        public get isNested(): boolean {
            return this._isNested === undefined ? false : this._isNested;
        }
        public get isArray(): boolean {
            return this._isArray === undefined ? false : this._isArray;
        }
        public get isGenericType(): boolean {
            return this._isGenericType === undefined ? false : this._isGenericType;
        }
        public get isGenericTypeDefinition(): boolean {
            return this._isGenericType === true && this._genericTypeArguments === undefined;
        }
        public get declaringType(): TypeReference {
            return this._declaringType;
        }
        public get elementType(): TypeReference {
            return this._elementType;
        }
        public get genericTypeDefinition(): TypeReference {
            if (this._isGenericType === true && this._genericTypeDefinition === undefined && this._genericTypeArguments !== undefined) {
                let typeReference = new TypeReference();
                typeReference._name = this._name;
                typeReference._fullName = this._fullName;
                typeReference._isNested = this._isNested;
                typeReference._isGenericType = true;
                typeReference._genericArgumentLength = this._genericArgumentLength;
                typeReference._declaringType = this._declaringType;
                this._genericTypeDefinition = typeReference;
            }

            return this._genericTypeDefinition;
        }
        public get genericTypeArguments(): system.collections.generic.IReadOnlyList<TypeReference> {
            let list = new List<TypeReference>();
            if (this._genericTypeArguments !== undefined) {
                for (let assembly of this._genericTypeArguments) {
                    list.add(assembly.typeReference);
                }
            }
            return list;
        }

        private static readTypeReference(tokenizer: Tokenizer): TypeReference {
            let ch: string;
            let names = new Array<string>();
            names.push(tokenizer.readSymbol());
            while (!tokenizer.endOfStream) {
                ch = tokenizer.peekChar();
                switch (ch) {
                    case '.':
                        tokenizer.readChar();
                        names.push(tokenizer.readSymbol());
                        break;
                    case TypeReference.genericSeparatorChar:
                        tokenizer.readChar();
                        let num = tokenizer.readNumber();
                        names[names.length - 1] += TypeReference.genericSeparatorChar + num.toString();
                        let genericType = new TypeReference();
                        genericType._name = names[names.length - 1];
                        genericType._fullName = names.join('.');
                        genericType._isGenericType = true;
                        genericType._genericArgumentLength = num;
                        return genericType;
                    default:
                        let type = new TypeReference();
                        type._name = names[names.length - 1];
                        type._fullName = names.join('.');
                        return type;
                }
            }

            let type = new TypeReference();
            type._name = names[names.length - 1];
            type._fullName = names.join('.');
            return type;
        }

        public static readFrom(tokenizer: Tokenizer): TypeReference {
            if (tokenizer == null)
                throw 'argument null exception: tokenizer';

            let types = new Array<TypeReference>();
            let assembiles = new Array<AssemblyReference>();
            types.push(this.readTypeReference(tokenizer));
            while (!tokenizer.endOfStream && tokenizer.maybeEat('+')) {
                let nestedType = this.readTypeReference(tokenizer);
                nestedType._isNested = true;
                nestedType._declaringType = types[types.length - 1];
                types.push(nestedType);
            }
            if (!tokenizer.endOfStream && tokenizer.maybeEat('[')) {

                do {
                    tokenizer.skipWhiteSpace();
                    if (!tokenizer.maybeEat('['))
                        throw 'invalid separator: ' + tokenizer.peekChar();

                    tokenizer.skipWhiteSpace();
                    assembiles.push(AssemblyReference.readFrom(tokenizer));
                    tokenizer.skipWhiteSpace();
                    if (!tokenizer.maybeEat(']'))
                        throw 'invalid separator: ' + tokenizer.peekChar();

                    tokenizer.skipWhiteSpace();
                } while (tokenizer.maybeEat(','));
                if (!tokenizer.maybeEat(']'))
                    throw 'invalid separator: ' + tokenizer.peekChar();
            }
            let offset = 0;
            let type: TypeReference;
            for (let i = 0; i < types.length; i++) {
                type = types[i];
                if (type._isGenericType === true) {
                    type._genericTypeArguments = new Array<AssemblyReference>();
                    for (; offset < assembiles.length; offset++) {
                        type._genericTypeArguments.push(assembiles[offset]);
                    }
                }
            }
            return types[types.length - 1];
        }
        public static parse(text: string): TypeReference {
            if (text == null)
                throw 'argument null exception: text';

            let reader = new TextReader(text);
            let tokenizer = new Tokenizer(reader);
            return TypeReference.readFrom(tokenizer);
        }

        public toString(): string {
            return '{name = ' + this._name + ' fullName = ' + this.fullName + '}';
        }
    }

    class UITypeSelector {
        private _definitionType: UIType;
        private _selector: system.collections.generic.List<UIType>;

        public constructor(assembly: UIAssembly, metadata: any) {
            this._definitionType = assembly.getType(metadata['definitionType']);
            this._selector = new List<UIType>();
            for (let name of metadata['selector']) {
                let type = assembly.getType(name);
                this._selector.add(type);
            }
        }

        public get definitionType(): UIType {
            return this._definitionType;
        }
        public get selector(): system.collections.generic.IReadOnlyList<UIType> {
            return this._selector;
        }
    }
    class UIAssembly {
        private _metadata: any;
        private _version: number;
        private _types: system.collections.generic.Dictionary<string, UIType> = new Dictionary<string, UIType>();
        private _selectors: system.collections.generic.Dictionary<UIType, UITypeSelector> = new Dictionary<UIType, UITypeSelector>();
        private _entryPoint: UIType;

        private constructor(metadata: any) {
            this._metadata = metadata;
            this._version = metadata['version'];

            let type: UIType;
            for (let typemeta of metadata['types']) {
                type = new UIType(this, typemeta);
                this._types.add(type.fullName, type);
            }
        }

        public get metadata(): any {
            return this._metadata;
        }
        public get version(): number {
            return this._version;
        }
        public get entryPoint(): UIType {
            return this._entryPoint;
        }

        public static load(metadata): UIAssembly {
            if (metadata == null)
                throw 'argument null exception: metadata';

            let assembly = new UIAssembly(metadata);
            assembly.initialize();
            return assembly;
        }

        private initialize(): void {
            for (let type of this._types.values) {
                type.initialize();
            }
            if ('selectors' in this._metadata) {
                for (let selector of this._metadata['selectors']) {
                    let typeSelector = new UITypeSelector(this, selector);
                    this._selectors.add(typeSelector.definitionType, typeSelector);
                }
            }
            if ('entryPoint' in this._metadata)
                this._entryPoint = this.getType(this._metadata['entryPoint']);
        }
        private getReferenceType(typeReference: TypeReference): UIType {
            let type: UIType = null;
            if (typeReference.isNested) {
                let declaringType = this.getReferenceType(typeReference.declaringType);
                if (declaringType != null) {
                    type = declaringType.getNestedType(typeReference.name);
                }
            } else {
                type = this._types.tryGetValue(typeReference.fullName);
            }
            return type;
        }

        public getType(name: string, throwOnError: boolean = false): UIType {
            if (name == null)
                throw 'argument null exception: name';

            let typeReference: TypeReference;
            try {
                typeReference = TypeReference.parse(name);
            } catch (ex) {
                if (throwOnError)
                    throw ex;

                return null;
            }
            let type = this.getReferenceType(typeReference);
            if (type == null && throwOnError) {
                throw 'type: ' + name + ' not found';
            }

            return type;
        }
        public getTypes(): Array<UIType> {
            let array = new Array<UIType>();
            for (let type of this._types.values) {
                array.push(type);
            }
            return array;
        }
        public getSelector(type: UIType): system.collections.generic.IReadOnlyList<UIType> {
            if (type == null)
                throw 'argument null exception: type';

            let typeSelector = this._selectors.tryGetValue(type);
            return typeSelector != null ? typeSelector.selector : null;
        }
    }
    enum UIMemberTypes {
        field,
        typeInfo,
        nestedType,
    }
    enum UIRelativeSource {
        none,
        template,
        self,
        findAncestor,
    }
    class UIDataBinding {
        private _assembly: UIAssembly;
        private _metadata: any;
        private _path: string;
        private _element: string;
        private _display: string;
        private _source: UIType;
        private _relativeSource: UIRelativeSource;
        private _ancestorType: UIType;
        private _ancestorLevel: number;

        public constructor(assembly: UIAssembly, metadata: any) {
            if (assembly == null)
                throw 'argument null exception: assembly';
            if (metadata == null)
                throw 'argument null exception: metadata';

            this._assembly = assembly;
            this._metadata = metadata;

            this._path = this.getMetadata<string>('path');
            this._element = this.getMetadata<string>('element');
            this._display = this.getMetadata<string>('display');
            this._relativeSource = this.getMetadata<number>('relativeSource', UIRelativeSource.none);
            this._ancestorLevel = this.getMetadata<number>('ancestorLevel', 0);
        }

        public get metadata(): any {
            return this._metadata;
        }
        public get path(): string {
            return this._path;
        }
        public get element(): string {
            return this._element;
        }
        public get display(): string {
            return this._display;
        }
        public get source(): UIType {
            if (this._source === undefined && 'source' in this._metadata) {
                this._source = this._assembly.getType(this._metadata['source']);
            }
            return this._source;
        }
        public get relativeSource(): UIRelativeSource {
            return this._relativeSource;
        }
        public get ancestorType(): UIType {
            if (this._ancestorType === undefined && 'ancestorType' in this._metadata) {
                this._ancestorType = this._assembly.getType(this._metadata['ancestorType']);
            }
            return this._ancestorType;
        }
        public get ancestorLevel(): number {
            return this._ancestorLevel;
        }

        private getMetadata<T>(name: string, defaultValue?: T): T {
            return name in this._metadata ? this._metadata[name] : defaultValue;
        }
    }
    abstract class UIMember {
        private _metadata: any;

        public constructor(metadata: any) {
            this._metadata = metadata;
        }

        public get metadata(): any {
            return this._metadata;
        }
        public abstract get name(): string;
        public abstract get memberType(): UIMemberTypes;
        public abstract get declaringType(): UIType;
        public abstract get display(): string;
        public abstract get isReadOnly(): boolean;

        protected getMetadata<T>(name: string, defaultValue?: T): T {
            return name in this._metadata ? this._metadata[name] : defaultValue;
        }

        public abstract initialize(): void;
    }
    enum UISelectorCategory {
        defined,
        default,
    }
    class UIField extends UIMember {
        private _name: string;
        private _declaringType: UIType;
        private _fieldType: UIType;
        private _display: string;
        private _isReadOnly: boolean;
        private _identity: boolean;
        private _sortIndex: number;
        private _tooltip: string;
        private _dataTemplate: UIType;
        private _itemDataTemplate: UIType;
        private _selector: system.collections.generic.List<UIType>;
        private _itemSelector: system.collections.generic.List<UIType>;
        private _selectorCategory: UISelectorCategory;
        private _itemSelectorCategory: UISelectorCategory;
        private _default: any;
        private _dataBinding: UIDataBinding;
        private _itemDataBinding: UIDataBinding;

        public constructor(declaringType: UIType, metadata: any) {
            super(metadata);
            this._name = metadata['name'];
            this._declaringType = declaringType;
            this._display = this.getMetadata<string>('display');
            this._isReadOnly = this.getMetadata<boolean>('isReadOnly', false);
            this._identity = this.getMetadata<boolean>('identity', false);
            this._sortIndex = this.getMetadata<number>('sortIndex', 0);
            this._tooltip = this.getMetadata<string>('tooltip');
            this._selectorCategory = this.getMetadata('selectorCategory', UISelectorCategory.defined);
            this._itemSelectorCategory = this.getMetadata('itemSelectorCategory', UISelectorCategory.defined);
            this._default = this.getMetadata<any>('default');
        }

        public get name(): string {
            return this._name;
        }
        public get declaringType(): UIType {
            return this._declaringType;
        }
        public get memberType() {
            return UIMemberTypes.field;
        }
        public get fieldType(): UIType {
            if (this._fieldType === undefined && 'fieldType' in this.metadata) {
                let assembly = this._declaringType.assembly;
                this._fieldType = assembly.getType(this.metadata['fieldType']);
            }
            return this._fieldType;
        }
        public get display(): string {
            return this._display;
        }
        public get isReadOnly(): boolean {
            return this._isReadOnly;
        }
        public get identity(): boolean {
            return this._identity;
        }
        public get sortIndex(): number {
            return this._sortIndex;
        }
        public get tooltip(): string {
            return this._tooltip;
        }
        public get dataTemplate(): UIType {
            if (this._dataTemplate === undefined && 'dataTemplate' in this.metadata) {
                let assembly = this._declaringType.assembly;
                this._dataTemplate = assembly.getType(this.metadata['dataTemplate']);
            }
            return this._dataTemplate;
        }
        public get itemDataTemplate(): UIType {
            if (this._itemDataTemplate === undefined && 'itemDataTemplate' in this.metadata) {
                let assembly = this._declaringType.assembly;
                this._itemDataTemplate = assembly.getType(this.metadata['itemDataTemplate']);
            }
            return this._itemDataTemplate;
        }
        public get selector(): system.collections.generic.IReadOnlyList<UIType> {
            if (this._selector === undefined) {
                switch (this._selectorCategory) {
                    case UISelectorCategory.defined:
                        if ('selector' in this.metadata) {
                            this._selector = new List<UIType>();
                            let type: UIType;
                            let assembly = this._declaringType.assembly;
                            for (let name of this.metadata['selector']) {
                                type = assembly.getType(name);
                                this._selector.add(type);
                            }
                        }
                        break;
                    case UISelectorCategory.default:
                        {
                            let assembly = this._declaringType.assembly;
                            let typeSelector = assembly.getSelector(this.fieldType);
                            if (typeSelector != null) {
                                this._selector = new List<UIType>(typeSelector);
                            }
                        }
                        break;
                    default:
                        throw 'unknown selector category:' + this._selectorCategory;
                }
            }
            return this._selector;
        }
        public get itemSelector(): system.collections.generic.IReadOnlyList<UIType> {
            if (this._itemSelector === undefined) {
                switch (this._itemSelectorCategory) {
                    case UISelectorCategory.defined:
                        if ('itemSelector' in this.metadata) {
                            let type: UIType;
                            let assembly = this._declaringType.assembly;
                            this._itemSelector = new List<UIType>();
                            for (let name of this.metadata['itemSelector']) {
                                type = assembly.getType(name);
                                this._itemSelector.add(type);
                            }
                        }
                        break;
                    case UISelectorCategory.default:
                        let definitionType: UIType;
                        if (this.fieldType.isArray) {
                            definitionType = this.fieldType.elementType;
                        } else if (this.fieldType.isGenericType && this.fieldType.genericTypeArguments.count > 0) {
                            definitionType = this.fieldType.genericTypeArguments[0];
                        } else {
                            throw 'invalid selector definition type:' + this.toString();
                        }
                        let assembly = this._declaringType.assembly;
                        let typeSelector = assembly.getSelector(definitionType);
                        if (typeSelector != null) {
                            this._itemSelector = new List<UIType>(typeSelector);
                        }
                        break;
                    default:
                        throw 'unknown item selector category:' + this._itemSelectorCategory;
                }
            }
            return this._itemSelector;
        }
        public get default(): any {
            return this._default;
        }
        public get dataBinding(): UIDataBinding {
            return this._dataBinding;
        }
        public get itemDataBinding(): UIDataBinding {
            return this._itemDataBinding;
        }

        public initialize(): void {
            let assembly = this._declaringType.assembly;
            if ('dataBinding' in this.metadata) {
                this._dataBinding = new UIDataBinding(assembly, this.metadata['dataBinding']);
            }
            if ('itemDataBinding' in this.metadata) {
                this._itemDataBinding = new UIDataBinding(assembly, this.metadata['itemDataBinding']);
            }
        }
        public toString(): string {
            return '{' + this.fieldType.name + ' ' + this._name + '}';
        }

        public getValue(obj: any, index?: number): any {
            if (obj == null)
                throw 'argument null exception: obj';

            if (index !== undefined) {
                //集合
                return obj[index][this._name];
            } else {
                return obj[this._name];
            }
        }
        public setValue(obj: any, value: any, index?: number): void {
            if (obj == null)
                throw 'argument null exception: obj';

            if (index !== undefined) {
                //集合
                obj[index][this._name] = value;
            } else {
                obj[this._name] = value;
            }
        }
    }
    class UIType extends UIMember {
        private _members: system.collections.generic.Dictionary<string, UIMember> = new Dictionary<string, UIMember>();
        private _assembly: UIAssembly;
        private _fullName: string;
        private _baseType: UIType;
        private _typeReference: TypeReference;
        private _declaringType: UIType;
        private _underlyingType: UIType;
        private _elementType: UIType;
        private _genericTypeArguments: system.collections.generic.List<UIType>;
        private _memberType: UIMemberTypes;
        private _display: string;
        private _isReadOnly: boolean;

        public constructor(assembly: UIAssembly, metadata: any) {
            super(metadata);
            this._assembly = assembly;
            this._fullName = metadata['fullName'];
            this._memberType = metadata['memberType'];

            this._typeReference = TypeReference.parse(this._fullName);
            this._display = this.getMetadata<string>('display');
            this._isReadOnly = this.getMetadata<boolean>('isReadOnly', false);
            if ('members' in this.metadata) {
                let member: UIMember;
                if (this.isEnum) {
                    for (let membermeta of this.metadata['members']) {
                        member = new UIField(this, membermeta);
                        this._members.add(member.name, member);
                    }
                } else {
                    let memberType: UIMemberTypes;
                    for (let membermeta of this.metadata['members']) {
                        memberType = membermeta['memberType'];
                        switch (memberType) {
                            case UIMemberTypes.nestedType:
                                member = new UIType(this._assembly, membermeta);
                                break;
                            case UIMemberTypes.field:
                                member = new UIField(this, membermeta);
                                break;
                            default:
                                throw 'unknown memberType: ' + memberType;
                        }
                        this._members.add(member.name, member);
                    }
                }
            }
        }

        public get assembly(): UIAssembly {
            return this._assembly;
        }
        public get fullName(): string {
            return this._fullName;
        }
        public get baseType(): UIType {
            if (this._baseType === undefined && 'baseType' in this.metadata) {
                this._baseType = this.assembly.getType(this.metadata['baseType']);
            }
            return this._baseType;
        }
        public get name(): string {
            return this._typeReference.name;
        }
        public get memberType(): UIMemberTypes {
            return this._memberType;
        }
        public get isNested(): boolean {
            return this._typeReference.isNested;
        }
        public get isArray(): boolean {
            return this._typeReference.isArray;
        }
        public get isGenericType(): boolean {
            return this._typeReference.isGenericType;
        }
        public get isGenericTypeDefinition(): boolean {
            return this._typeReference.isGenericTypeDefinition;
        }
        public get declaringType(): UIType {
            if (this._declaringType === undefined && this._typeReference.declaringType !== undefined) {
                let type = this._typeReference.declaringType;
                this._declaringType = this._assembly.getType(type.fullName);
            }

            return this._declaringType;
        }
        public get underlyingType(): UIType {
            if (this._underlyingType === undefined && 'underlyingType' in this.metadata) {
                this._underlyingType = this._assembly.getType(this.metadata['underlyingType']);
            }
            return this._underlyingType;
        }
        public get elementType(): UIType {
            if (this._typeReference.isArray && this._elementType === undefined) {
                this._elementType = this._assembly.getType(this._typeReference.elementType.fullName);
            }
            return this._elementType;
        }
        public get genericTypeDefinition(): TypeReference {
            return this._typeReference.genericTypeDefinition;
        }
        public get genericTypeArguments(): system.collections.generic.IReadOnlyList<UIType> {
            if (this._genericTypeArguments === undefined && this._typeReference.genericTypeArguments !== undefined) {
                this._genericTypeArguments = new List<UIType>();
                for (let genericTypeArgument of this._typeReference.genericTypeArguments) {
                    let type = this._assembly.getType(genericTypeArgument.fullName);
                    this._genericTypeArguments.add(type);
                }
            }
            return this._genericTypeArguments;
        }
        public get display(): string {
            return this._display;
        }
        public get isReadOnly(): boolean {
            return this._isReadOnly;
        }
        public get isEnum(): boolean {
            return 'baseType' in this.metadata && this.metadata['baseType'] === 'System.Enum';
        }
        public getNestedType(name: string): UIType {
            if (name == null)
                throw 'argument null exception: name';

            let member = this._members.tryGetValue(name);
            if (member != null && member.memberType === UIMemberTypes.nestedType) {
                return <UIType>member;
            }
            return null;
        }
        public getNestedTypes(): system.collections.generic.IReadOnlyList<UIType> {
            let array = new List<UIType>();
            for (let member of this._members.values) {
                if (member.memberType === UIMemberTypes.nestedType) {
                    array.add(<UIType>member);
                }
            }
            return array;
        }
        public getField(name: string): UIField {
            if (name == null)
                throw 'argument null exception: name';

            let member = this._members.tryGetValue(name);
            if (member == null && this.baseType != null) {
                member = this.baseType.getField(name);
            }
            return <UIField>member;
        }
        public getFields(): system.collections.generic.IReadOnlyList<UIField> {
            let dictionary = new Dictionary<string, UIField>();
            if (this.baseType != null) {
                for (let field of this.baseType.getFields()) {
                    dictionary.addOrUpdate(field.name, field);
                }
            }
            for (let member of this._members.values) {
                if (member.memberType === UIMemberTypes.field) {
                    dictionary.addOrUpdate(member.name, <UIField>member);
                }
            }
            return new List<UIField>(dictionary.values);
        }

        public initialize(): void {
            for (let member of this._members.values) {
                member.initialize();
            }
        }
        public isSubclassOf(type: UIType): boolean {
            if (type == null)
                throw 'argument null exception: type';

            let baseType = this.baseType;
            while (baseType != null) {
                if (baseType == type)
                    return true;

                baseType = baseType.baseType;
            }
            return false;
        }
        public toString(): string {
            return this._typeReference.toString();
        }
    }

    return {
        UIAssembly: UIAssembly,
        UIMemberTypes: UIMemberTypes,
        UIRelativeSource: UIRelativeSource,
        UIDataBinding: UIDataBinding,
        UIMember: UIMember,
        UIField: UIField,
        UIType: UIType,
    };
});