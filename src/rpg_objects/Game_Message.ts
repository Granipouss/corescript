/**
 * The game object class for the state of the message window that displays text
 * or selections, etc.
 */
export class Game_Message {
    private _texts: string[];
    private _choices: string[];
    private _faceName: string;
    private _faceIndex: number;
    private _background: number;
    private _positionType: number;
    private _choiceDefaultType: number;
    private _choiceCancelType: number;
    private _choiceBackground: number;
    private _choicePositionType: number;
    private _numInputVariableId: number;
    private _numInputMaxDigits: number;
    private _itemChoiceVariableId: number;
    private _itemChoiceItypeId: number;
    private _scrollMode: boolean;
    private _scrollSpeed: number;
    private _scrollNoFast: boolean;
    private _choiceCallback?: (n: number) => void;

    constructor() {
        this.clear();
    }

    clear(): void {
        this._texts = [];
        this._choices = [];
        this._faceName = '';
        this._faceIndex = 0;
        this._background = 0;
        this._positionType = 2;
        this._choiceDefaultType = 0;
        this._choiceCancelType = 0;
        this._choiceBackground = 0;
        this._choicePositionType = 2;
        this._numInputVariableId = 0;
        this._numInputMaxDigits = 0;
        this._itemChoiceVariableId = 0;
        this._itemChoiceItypeId = 0;
        this._scrollMode = false;
        this._scrollSpeed = 2;
        this._scrollNoFast = false;
        this._choiceCallback = null;
    }

    choices(): string[] {
        return this._choices;
    }

    faceName(): string {
        return this._faceName;
    }

    faceIndex(): number {
        return this._faceIndex;
    }

    background(): number {
        return this._background;
    }

    positionType(): number {
        return this._positionType;
    }

    choiceDefaultType(): number {
        return this._choiceDefaultType;
    }

    choiceCancelType(): number {
        return this._choiceCancelType;
    }

    choiceBackground(): number {
        return this._choiceBackground;
    }

    choicePositionType(): number {
        return this._choicePositionType;
    }

    numInputVariableId(): number {
        return this._numInputVariableId;
    }

    numInputMaxDigits(): number {
        return this._numInputMaxDigits;
    }

    itemChoiceVariableId(): number {
        return this._itemChoiceVariableId;
    }

    itemChoiceItypeId(): number {
        return this._itemChoiceItypeId;
    }

    scrollMode(): boolean {
        return this._scrollMode;
    }

    scrollSpeed(): number {
        return this._scrollSpeed;
    }

    scrollNoFast(): boolean {
        return this._scrollNoFast;
    }

    add(text: string): void {
        this._texts.push(text);
    }

    setFaceImage(faceName: string, faceIndex: number): void {
        this._faceName = faceName;
        this._faceIndex = faceIndex;
    }

    setBackground(background: number): void {
        this._background = background;
    }

    setPositionType(positionType: number): void {
        this._positionType = positionType;
    }

    setChoices(choices: string[], defaultType: number, cancelType: number): void {
        this._choices = choices;
        this._choiceDefaultType = defaultType;
        this._choiceCancelType = cancelType;
    }

    setChoiceBackground(background: number): void {
        this._choiceBackground = background;
    }

    setChoicePositionType(positionType: number): void {
        this._choicePositionType = positionType;
    }

    setNumberInput(variableId: number, maxDigits: number): void {
        this._numInputVariableId = variableId;
        this._numInputMaxDigits = maxDigits;
    }

    setItemChoice(variableId: number, itemType: number): void {
        this._itemChoiceVariableId = variableId;
        this._itemChoiceItypeId = itemType;
    }

    setScroll(speed: number, noFast: boolean): void {
        this._scrollMode = true;
        this._scrollSpeed = speed;
        this._scrollNoFast = noFast;
    }

    setChoiceCallback(callback: (n: number) => void): void {
        this._choiceCallback = callback;
    }

    onChoice(n: number): void {
        if (this._choiceCallback) {
            this._choiceCallback(n);
            this._choiceCallback = null;
        }
    }

    hasText(): boolean {
        return this._texts.length > 0;
    }

    isChoice(): boolean {
        return this._choices.length > 0;
    }

    isNumberInput(): boolean {
        return this._numInputVariableId > 0;
    }

    isItemChoice(): boolean {
        return this._itemChoiceVariableId > 0;
    }

    isBusy(): boolean {
        return this.hasText() || this.isChoice() || this.isNumberInput() || this.isItemChoice();
    }

    newPage(): void {
        if (this._texts.length > 0) {
            this._texts[this._texts.length - 1] += '\f';
        }
    }

    allText(): string {
        return this._texts.join('\n');
    }
}
