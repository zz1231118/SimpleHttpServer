define((require) => {
    let system = require('./netcore/system');
    let generic = require('./netcore/system.collections.generic');
    let Char = system.Char;
    let List = generic.List;
    let Dictionary = generic.Dictionary;
    class TextReader {
        constructor(text) {
            if (text == null)
                throw 'argument null exception: text';
            this._text = text;
            this._position = 0;
        }
        get endOfStream() {
            return this._position >= this._text.length;
        }
        peek(offset = 0) {
            if (this._position + offset >= this._text.length)
                throw 'end of stream';
            return this._text[this._position + offset];
        }
        read() {
            if (this._position >= this._text.length)
                throw 'end of stream';
            return this._text[this._position++];
        }
    }
    class Tokenizer {
        constructor(reader) {
            if (reader == null)
                throw 'argument null exception: reader';
            this._reader = reader;
        }
        get endOfStream() {
            return this._reader.endOfStream;
        }
        peekChar(offset = 0) {
            return this._reader.peek(offset);
        }
        readChar() {
            return this._reader.read();
        }
        readSymbol() {
            let ch = this._reader.read();
            if (!Char.isUnderline(ch) && !Char.isLetter(ch))
                throw 'invalid symbol char: ' + ch;
            let symbol = ch;
            while (!this.endOfStream) {
                ch = this._reader.peek();
                if (Char.isUnderline(ch) || Char.isNumber(ch) || Char.isLetter(ch)) {
                    symbol += this._reader.read();
                }
                else {
                    break;
                }
            }
            return symbol;
        }
        readNumber() {
            let ch = this._reader.read();
            if (!Char.isNumber(ch))
                throw 'invalid number char: ' + ch;
            let symbol = ch;
            while (!this.endOfStream) {
                ch = this._reader.peek();
                if (Char.isNumber(ch)) {
                    symbol += this._reader.read();
                }
                else {
                    break;
                }
            }
            return parseInt(symbol);
        }
        readGuid() {
            let ch = this._reader.read();
            if (!Char.isNumber(ch) && !Char.isLetter(ch))
                throw 'invalid guid char: ' + ch;
            let symbol = ch;
            while (!this.endOfStream) {
                ch = this._reader.peek();
                if (Char.isNumber(ch) || Char.isLetter(ch)) {
                    symbol += this._reader.read();
                }
                else {
                    break;
                }
            }
            return symbol;
        }
        skipWhiteSpace() {
            let ch;
            while (!this.endOfStream) {
                ch = this._reader.peek();
                if (Char.isWhiteSpace(ch)) {
                    this._reader.read();
                }
                else {
                    break;
                }
            }
        }
        maybeEat(text) {
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
        constructor() {
        }
        get fullName() {
            return this._typeReference.fullName + ', ' + this._assembly + ', Version=' + this._version + ', Culture=' + this._culture + ', PublicKeyToken=' + this.publicKeyToken;
        }
        get typeReference() {
            return this._typeReference;
        }
        get assembly() {
            return this._assembly;
        }
        get version() {
            return this._version;
        }
        get culture() {
            return this._culture;
        }
        get publicKeyToken() {
            return this._publicKeyToken;
        }
        static readFrom(tokenizer) {
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
        constructor() {
        }
        get name() {
            return this._name;
        }
        get fullName() {
            let name;
            let assembiles = new List();
            if (this._isGenericType && this._genericTypeArguments !== undefined) {
                assembiles.addRange(this._genericTypeArguments);
            }
            if (this._isNested) {
                name = this._name;
                let nestedType = this._declaringType;
                while (true) {
                    if (nestedType.isGenericType && nestedType._genericTypeArguments !== undefined) {
                        if (assembiles === undefined) {
                            assembiles = new List();
                        }
                        for (let i = nestedType._genericTypeArguments.length - 1; i >= 0; i--) {
                            assembiles.insert(nestedType._genericTypeArguments[i], 0);
                        }
                    }
                    if (nestedType._isNested) {
                        name = nestedType._name + '+' + name;
                        nestedType = nestedType._declaringType;
                    }
                    else {
                        name = nestedType._fullName + '+' + name;
                        break;
                    }
                }
            }
            else {
                name = this._fullName;
            }
            if (assembiles.count) {
                name += '[';
                let assembly;
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
        get isNested() {
            return this._isNested === undefined ? false : this._isNested;
        }
        get isArray() {
            return this._isArray === undefined ? false : this._isArray;
        }
        get isGenericType() {
            return this._isGenericType === undefined ? false : this._isGenericType;
        }
        get isGenericTypeDefinition() {
            return this._isGenericType === true && this._genericTypeArguments === undefined;
        }
        get declaringType() {
            return this._declaringType;
        }
        get elementType() {
            return this._elementType;
        }
        get genericTypeDefinition() {
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
        get genericTypeArguments() {
            let list = new List();
            if (this._genericTypeArguments !== undefined) {
                for (let assembly of this._genericTypeArguments) {
                    list.add(assembly.typeReference);
                }
            }
            return list;
        }
        static readTypeReference(tokenizer) {
            let ch;
            let names = new Array();
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
        static readFrom(tokenizer) {
            if (tokenizer == null)
                throw 'argument null exception: tokenizer';
            let types = new Array();
            let assembiles = new Array();
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
            let type;
            for (let i = 0; i < types.length; i++) {
                type = types[i];
                if (type._isGenericType === true) {
                    type._genericTypeArguments = new Array();
                    for (; offset < assembiles.length; offset++) {
                        type._genericTypeArguments.push(assembiles[offset]);
                    }
                }
            }
            return types[types.length - 1];
        }
        static parse(text) {
            if (text == null)
                throw 'argument null exception: text';
            let reader = new TextReader(text);
            let tokenizer = new Tokenizer(reader);
            return TypeReference.readFrom(tokenizer);
        }
        toString() {
            return '{name = ' + this._name + ' fullName = ' + this.fullName + '}';
        }
    }
    TypeReference.genericSeparatorChar = '`';
    class UITypeSelector {
        constructor(assembly, metadata) {
            this._definitionType = assembly.getType(metadata['definitionType']);
            this._selector = new List();
            for (let name of metadata['selector']) {
                let type = assembly.getType(name);
                this._selector.add(type);
            }
        }
        get definitionType() {
            return this._definitionType;
        }
        get selector() {
            return this._selector;
        }
    }
    class UIAssembly {
        constructor(metadata) {
            this._types = new Dictionary();
            this._selectors = new Dictionary();
            this._metadata = metadata;
            this._version = metadata['version'];
            let type;
            for (let typemeta of metadata['types']) {
                type = new UIType(this, typemeta);
                this._types.add(type.fullName, type);
            }
        }
        get metadata() {
            return this._metadata;
        }
        get version() {
            return this._version;
        }
        get entryPoint() {
            return this._entryPoint;
        }
        static load(metadata) {
            if (metadata == null)
                throw 'argument null exception: metadata';
            let assembly = new UIAssembly(metadata);
            assembly.initialize();
            return assembly;
        }
        initialize() {
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
        getReferenceType(typeReference) {
            let type = null;
            if (typeReference.isNested) {
                let declaringType = this.getReferenceType(typeReference.declaringType);
                if (declaringType != null) {
                    type = declaringType.getNestedType(typeReference.name);
                }
            }
            else {
                type = this._types.tryGetValue(typeReference.fullName);
            }
            return type;
        }
        getType(name, throwOnError = false) {
            if (name == null)
                throw 'argument null exception: name';
            let typeReference;
            try {
                typeReference = TypeReference.parse(name);
            }
            catch (ex) {
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
        getTypes() {
            let array = new Array();
            for (let type of this._types.values) {
                array.push(type);
            }
            return array;
        }
        getSelector(type) {
            if (type == null)
                throw 'argument null exception: type';
            let typeSelector = this._selectors.tryGetValue(type);
            return typeSelector != null ? typeSelector.selector : null;
        }
    }
    let UIMemberTypes;
    (function (UIMemberTypes) {
        UIMemberTypes[UIMemberTypes["field"] = 0] = "field";
        UIMemberTypes[UIMemberTypes["typeInfo"] = 1] = "typeInfo";
        UIMemberTypes[UIMemberTypes["nestedType"] = 2] = "nestedType";
    })(UIMemberTypes || (UIMemberTypes = {}));
    let UIRelativeSource;
    (function (UIRelativeSource) {
        UIRelativeSource[UIRelativeSource["none"] = 0] = "none";
        UIRelativeSource[UIRelativeSource["template"] = 1] = "template";
        UIRelativeSource[UIRelativeSource["self"] = 2] = "self";
        UIRelativeSource[UIRelativeSource["findAncestor"] = 3] = "findAncestor";
    })(UIRelativeSource || (UIRelativeSource = {}));
    class UIDataBinding {
        constructor(assembly, metadata) {
            if (assembly == null)
                throw 'argument null exception: assembly';
            if (metadata == null)
                throw 'argument null exception: metadata';
            this._assembly = assembly;
            this._metadata = metadata;
            this._path = this.getMetadata('path');
            this._element = this.getMetadata('element');
            this._display = this.getMetadata('display');
            this._relativeSource = this.getMetadata('relativeSource', UIRelativeSource.none);
            this._ancestorLevel = this.getMetadata('ancestorLevel', 0);
        }
        get metadata() {
            return this._metadata;
        }
        get path() {
            return this._path;
        }
        get element() {
            return this._element;
        }
        get display() {
            return this._display;
        }
        get source() {
            if (this._source === undefined && 'source' in this._metadata) {
                this._source = this._assembly.getType(this._metadata['source']);
            }
            return this._source;
        }
        get relativeSource() {
            return this._relativeSource;
        }
        get ancestorType() {
            if (this._ancestorType === undefined && 'ancestorType' in this._metadata) {
                this._ancestorType = this._assembly.getType(this._metadata['ancestorType']);
            }
            return this._ancestorType;
        }
        get ancestorLevel() {
            return this._ancestorLevel;
        }
        getMetadata(name, defaultValue) {
            return name in this._metadata ? this._metadata[name] : defaultValue;
        }
    }
    class UIMember {
        constructor(metadata) {
            this._metadata = metadata;
        }
        get metadata() {
            return this._metadata;
        }
        getMetadata(name, defaultValue) {
            return name in this._metadata ? this._metadata[name] : defaultValue;
        }
    }
    let UISelectorCategory;
    (function (UISelectorCategory) {
        UISelectorCategory[UISelectorCategory["defined"] = 0] = "defined";
        UISelectorCategory[UISelectorCategory["default"] = 1] = "default";
    })(UISelectorCategory || (UISelectorCategory = {}));
    class UIField extends UIMember {
        constructor(declaringType, metadata) {
            super(metadata);
            this._name = metadata['name'];
            this._declaringType = declaringType;
            this._display = this.getMetadata('display');
            this._isReadOnly = this.getMetadata('isReadOnly', false);
            this._identity = this.getMetadata('identity', false);
            this._sortIndex = this.getMetadata('sortIndex', 0);
            this._tooltip = this.getMetadata('tooltip');
            this._selectorCategory = this.getMetadata('selectorCategory', UISelectorCategory.defined);
            this._itemSelectorCategory = this.getMetadata('itemSelectorCategory', UISelectorCategory.defined);
            this._default = this.getMetadata('default');
        }
        get name() {
            return this._name;
        }
        get declaringType() {
            return this._declaringType;
        }
        get memberType() {
            return UIMemberTypes.field;
        }
        get fieldType() {
            if (this._fieldType === undefined && 'fieldType' in this.metadata) {
                let assembly = this._declaringType.assembly;
                this._fieldType = assembly.getType(this.metadata['fieldType']);
            }
            return this._fieldType;
        }
        get display() {
            return this._display;
        }
        get isReadOnly() {
            return this._isReadOnly;
        }
        get identity() {
            return this._identity;
        }
        get sortIndex() {
            return this._sortIndex;
        }
        get tooltip() {
            return this._tooltip;
        }
        get dataTemplate() {
            if (this._dataTemplate === undefined && 'dataTemplate' in this.metadata) {
                let assembly = this._declaringType.assembly;
                this._dataTemplate = assembly.getType(this.metadata['dataTemplate']);
            }
            return this._dataTemplate;
        }
        get itemDataTemplate() {
            if (this._itemDataTemplate === undefined && 'itemDataTemplate' in this.metadata) {
                let assembly = this._declaringType.assembly;
                this._itemDataTemplate = assembly.getType(this.metadata['itemDataTemplate']);
            }
            return this._itemDataTemplate;
        }
        get selector() {
            if (this._selector === undefined) {
                switch (this._selectorCategory) {
                    case UISelectorCategory.defined:
                        if ('selector' in this.metadata) {
                            this._selector = new List();
                            let type;
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
                                this._selector = new List(typeSelector);
                            }
                        }
                        break;
                    default:
                        throw 'unknown selector category:' + this._selectorCategory;
                }
            }
            return this._selector;
        }
        get itemSelector() {
            if (this._itemSelector === undefined) {
                switch (this._itemSelectorCategory) {
                    case UISelectorCategory.defined:
                        if ('itemSelector' in this.metadata) {
                            let type;
                            let assembly = this._declaringType.assembly;
                            this._itemSelector = new List();
                            for (let name of this.metadata['itemSelector']) {
                                type = assembly.getType(name);
                                this._itemSelector.add(type);
                            }
                        }
                        break;
                    case UISelectorCategory.default:
                        let definitionType;
                        if (this.fieldType.isArray) {
                            definitionType = this.fieldType.elementType;
                        }
                        else if (this.fieldType.isGenericType && this.fieldType.genericTypeArguments.count > 0) {
                            definitionType = this.fieldType.genericTypeArguments[0];
                        }
                        else {
                            throw 'invalid selector definition type:' + this.toString();
                        }
                        let assembly = this._declaringType.assembly;
                        let typeSelector = assembly.getSelector(definitionType);
                        if (typeSelector != null) {
                            this._itemSelector = new List(typeSelector);
                        }
                        break;
                    default:
                        throw 'unknown item selector category:' + this._itemSelectorCategory;
                }
            }
            return this._itemSelector;
        }
        get default() {
            return this._default;
        }
        get dataBinding() {
            return this._dataBinding;
        }
        get itemDataBinding() {
            return this._itemDataBinding;
        }
        initialize() {
            let assembly = this._declaringType.assembly;
            if ('dataBinding' in this.metadata) {
                this._dataBinding = new UIDataBinding(assembly, this.metadata['dataBinding']);
            }
            if ('itemDataBinding' in this.metadata) {
                this._itemDataBinding = new UIDataBinding(assembly, this.metadata['itemDataBinding']);
            }
        }
        toString() {
            return '{' + this.fieldType.name + ' ' + this._name + '}';
        }
        getValue(obj, index) {
            if (obj == null)
                throw 'argument null exception: obj';
            if (index !== undefined) {
                //集合
                return obj[index][this._name];
            }
            else {
                return obj[this._name];
            }
        }
        setValue(obj, value, index) {
            if (obj == null)
                throw 'argument null exception: obj';
            if (index !== undefined) {
                //集合
                obj[index][this._name] = value;
            }
            else {
                obj[this._name] = value;
            }
        }
    }
    class UIType extends UIMember {
        constructor(assembly, metadata) {
            super(metadata);
            this._members = new Dictionary();
            this._assembly = assembly;
            this._fullName = metadata['fullName'];
            this._memberType = metadata['memberType'];
            this._typeReference = TypeReference.parse(this._fullName);
            this._display = this.getMetadata('display');
            this._isReadOnly = this.getMetadata('isReadOnly', false);
            if ('members' in this.metadata) {
                let member;
                if (this.isEnum) {
                    for (let membermeta of this.metadata['members']) {
                        member = new UIField(this, membermeta);
                        this._members.add(member.name, member);
                    }
                }
                else {
                    let memberType;
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
        get assembly() {
            return this._assembly;
        }
        get fullName() {
            return this._fullName;
        }
        get baseType() {
            if (this._baseType === undefined && 'baseType' in this.metadata) {
                this._baseType = this.assembly.getType(this.metadata['baseType']);
            }
            return this._baseType;
        }
        get name() {
            return this._typeReference.name;
        }
        get memberType() {
            return this._memberType;
        }
        get isNested() {
            return this._typeReference.isNested;
        }
        get isArray() {
            return this._typeReference.isArray;
        }
        get isGenericType() {
            return this._typeReference.isGenericType;
        }
        get isGenericTypeDefinition() {
            return this._typeReference.isGenericTypeDefinition;
        }
        get declaringType() {
            if (this._declaringType === undefined && this._typeReference.declaringType !== undefined) {
                let type = this._typeReference.declaringType;
                this._declaringType = this._assembly.getType(type.fullName);
            }
            return this._declaringType;
        }
        get underlyingType() {
            if (this._underlyingType === undefined && 'underlyingType' in this.metadata) {
                this._underlyingType = this._assembly.getType(this.metadata['underlyingType']);
            }
            return this._underlyingType;
        }
        get elementType() {
            if (this._typeReference.isArray && this._elementType === undefined) {
                this._elementType = this._assembly.getType(this._typeReference.elementType.fullName);
            }
            return this._elementType;
        }
        get genericTypeDefinition() {
            return this._typeReference.genericTypeDefinition;
        }
        get genericTypeArguments() {
            if (this._genericTypeArguments === undefined && this._typeReference.genericTypeArguments !== undefined) {
                this._genericTypeArguments = new List();
                for (let genericTypeArgument of this._typeReference.genericTypeArguments) {
                    let type = this._assembly.getType(genericTypeArgument.fullName);
                    this._genericTypeArguments.add(type);
                }
            }
            return this._genericTypeArguments;
        }
        get display() {
            return this._display;
        }
        get isReadOnly() {
            return this._isReadOnly;
        }
        get isEnum() {
            return 'baseType' in this.metadata && this.metadata['baseType'] === 'System.Enum';
        }
        getNestedType(name) {
            if (name == null)
                throw 'argument null exception: name';
            let member = this._members.tryGetValue(name);
            if (member != null && member.memberType === UIMemberTypes.nestedType) {
                return member;
            }
            return null;
        }
        getNestedTypes() {
            let array = new List();
            for (let member of this._members.values) {
                if (member.memberType === UIMemberTypes.nestedType) {
                    array.add(member);
                }
            }
            return array;
        }
        getField(name) {
            if (name == null)
                throw 'argument null exception: name';
            let member = this._members.tryGetValue(name);
            if (member == null && this.baseType != null) {
                member = this.baseType.getField(name);
            }
            return member;
        }
        getFields() {
            let dictionary = new Dictionary();
            if (this.baseType != null) {
                for (let field of this.baseType.getFields()) {
                    dictionary.addOrUpdate(field.name, field);
                }
            }
            for (let member of this._members.values) {
                if (member.memberType === UIMemberTypes.field) {
                    dictionary.addOrUpdate(member.name, member);
                }
            }
            return new List(dictionary.values);
        }
        initialize() {
            for (let member of this._members.values) {
                member.initialize();
            }
        }
        isSubclassOf(type) {
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
        toString() {
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
//# sourceMappingURL=ui-assembiles.js.map