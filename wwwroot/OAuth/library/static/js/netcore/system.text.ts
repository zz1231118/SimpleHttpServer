define((require) => {
    class StringBuilder {
        private _text: string;

        public constructor(value?: string) {
            this._text = value || '';
        }

        public append(value: string): StringBuilder {
            this._text += value;
            return this;
        }

        public appendLine(value: string): StringBuilder {
            this._text += value + '\n';
            return this;
        }

        public toString(): string {
            return this._text;
        }
    }

    return {
        StringBuilder: StringBuilder
    };
});