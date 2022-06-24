import type { Sprite } from "./sprite"
import * as sprite from './sprite'

export function setup(){
    sprite.add_listener(sprite.EVENT.NEW_SPRITE,e=>{
        const s:Sprite = e.sprite
        if(s.type==sprite.TYPE.BACKGROUND){
            target_sprites.push(s)
        }
    })
}

const target_sprites:Array<Sprite> = []

interface P2d{
    x:number,
    y:number
}

function dist2(p:P2d,q:P2d){
    return (p.x-q.x)*(p.x-q.x)+(p.y-q.y)*(p.y-q.y)
}

const max_dist2 = 4*4

export function magnetic_offset(src:Sprite){
    const candidates:Array<P2d> = []
    src.magnetics.forEach(p=>{
        const s = src.transform_absolute(p)

        target_sprites.forEach(tgt=>{
            tgt.magnetics.forEach(q=>{
                const t = tgt.transform_absolute(q)
                if(dist2(s,t)>max_dist2)return
                candidates.push({x:t.x-s.x,y:t.y-s.y})
            })
        })
    })
    const stat:Array<number> = []
    let k = 0
    for(let i=0;i<candidates.length;i++){
        let c = 0
        const u = candidates[i]
        for(let j=i+1;j<candidates.length;j++){
            const v = candidates[j]
            if(dist2(u,v)<0.01){
                c += 1
            }
        }
        stat.push(c*Math.exp(-dist2({x:0,y:0},u)))
        if(stat[i]>stat[k])
            k=i
    }

    return candidates[k]
}



class QuadTree{

    public c00:QuadTree
    public c10:QuadTree
    public c01:QuadTree
    public c11:QuadTree
    public x:number
    public y:number
    public w:number
    public h:number

    /**
     * [x,x+w)X[y,y+h)
     * @param x 
     * @param y 
     * @param w 
     * @param h 
     */
    constructor(x:number,y:number,w:number,h:number,minimal_length:number=50){
        this.x=x
        this.y=y
        this.w=w
        this.h=h
        if(w>minimal_length){
            if(h>minimal_length){
                
            }
        }
    }

    public add_point(p:P2d){
        
    }
}