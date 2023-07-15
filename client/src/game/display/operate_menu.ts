import { Sprite } from "../sprite"
import { Sprite as PixiSprite} from "pixi.js"
import { Graphics, Text } from "pixi.js"
import type { p2d } from "../math_utils"

console.log("operate_menu.ts")

export class OperateMenu extends Sprite {

    public visible:boolean = true
    public item_list:string[] = []
    /**
     * 菜单项->回调函数
     */
    private item_to_callback:Map<string,Function[]> = new Map
    private item_height = 60
    private menu_width = 60

    constructor (){
        super(new PixiSprite())
        this.redraw_pixi()
    }

    private redraw_pixi(){
        let background = new Graphics()
        background.beginFill(0xffffffff)
        background.drawRect(0,0,this.menu_width,this.item_height*this.item_list.length)
        
        this.pixi.removeChildren(0,this.pixi.children.length)

        this.pixi.addChild(background)
        
        for (let i=0;i<this.item_list.length;i++){
            let item_text = new Text(this.item_list[i])
            item_text.position.set(this.menu_width/2-item_text.width/2, i*this.item_height + this.item_height/2 - item_text.height/2)
            this.pixi.addChild(item_text)
        }
    }

    public add_callback(item:string, callback:Function):void{
        if (this.item_to_callback.get(item)==null){
            this.item_to_callback.set(item, [])
            this.item_list.push(item)
        }
        this.item_to_callback.get(item).push(callback)
        this.redraw_pixi()
    }

    public click(rel_x:number, rel_y:number, e:any){
        if (rel_x>this.menu_width||rel_x<0) {
            throw ("传入点击坐标不合法" + rel_x + "," + rel_y)
        }
        if (rel_y>this.item_height*this.item_list.length||rel_y<0){
            throw ("传入点击坐标不合法" + rel_x + "," + rel_y)
        }
        let i = Math.floor(rel_y/this.item_height)
        this.item_to_callback.get(this.item_list[i]).forEach(
            func => func(e)
        )
    }

    public get_all

}


const id_to_menu:Map<string, OperateMenu> = new Map;

export function for_each_menu(func:(menu:OperateMenu)=>void){
    id_to_menu.forEach(func)
}

/**
 * 会触发 NEW_MENU 事件
 * @param id 
 * @returns 
 */
export function new_menu(id:string):OperateMenu{
    if (id_to_menu.get(id)!=null) {
        throw "id重复"
    }
    let m = new OperateMenu();
    id_to_menu.set(id, m)
    trigger_event(EVENT.NEW_MENU, {menu:m})
    return m
}

export function get_menu_by_id(id:string):OperateMenu{
    return id_to_menu.get(id);
}

export const EVENT = {NEW_MENU:0}

interface Listeners{
    [event:string|number]:Array<Function>
}

const listeners:Listeners = {}

export function add_listener(event_type:string|number,func:Function){
    if(!listeners[event_type]){
        listeners[event_type] = []
    }
    listeners[event_type].push(func)
}

function trigger_event(event_type:string|number,e={}){
    listeners[event_type]?.forEach(f=>{f(e)})
}