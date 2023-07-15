import { Sprite } from "../sprite"
import { Text, TextStyle } from "pixi.js"

console.log("display/name_text.ts")

export class NameText extends Sprite {
    constructor(name:string){
        const style = new TextStyle({
            fontSize: 20,
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            dropShadow: false,
            // dropShadowColor: '#000000',
            // dropShadowBlur: 4,
            // dropShadowAngle: Math.PI / 6,
            // dropShadowDistance: 6,
            wordWrap: true,
            wordWrapWidth: 440,
            lineJoin: 'round',
        });
        const text = new Text(name, style)
        super(text)
    }
}

