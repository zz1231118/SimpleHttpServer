define((require) => {
    class StringBuilder {
        constructor(value) {
            this._text = value || '';
        }
        append(value) {
            this._text += value;
            return this;
        }
        appendLine(value) {
            this._text += value + '\n';
            return this;
        }
        toString() {
            return this._text;
        }
    }
    return {
        StringBuilder: StringBuilder
    };
});
//# sourceMappingURL=system.text.js.map