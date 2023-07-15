/**
 * 处理手势识别
 */
import {p2d_add, p2d_distance, p2d_mul, p2d_rad_counterclockwise, p2d_to_string, p2d_vec, type p2d} from '../math_utils'
import { 
    drag_view, scale_view_2, 
    start_dragging_view, 
    start_scale_view_2, 
    start_rotate_view_2, 
    rotate_view_clockwise_2,
    round_view_rotation
 } from "../display/display"
import {print_log} from '../game'
import type { Application } from "@pixi/app"
import type { MyPointerEvent} from './interaction'


console.log("touch.ts")
export const TOUCHACTION = {TRANS:'trans',ROTATE:'rotate',SCALE:'scale',NONE:'none'}

let canvas:HTMLCanvasElement

export function setup(app:Application){
    canvas = app.view
    app.view.addEventListener('touchstart',touchstart_handler)
    app.view.addEventListener('touchend',touchend_handler)
    app.view.addEventListener('touchmove',touchmove_handler)
    app.view.addEventListener('touchcancel',touchcancel_handler)
}

export function get_current_action(){
    return current_action
}

export function touch_to_pointer(touch:Touch):MyPointerEvent{
    return  {
                ctrlKey:false,
                offsetX:touch.pageX - canvas.offsetLeft,
                offsetY:touch.pageY - canvas.offsetTop
            }


}

/**
 * 处理手势识别
 * @param e 
 */
function touchstart_handler(e:TouchEvent){
    print_log('touchstart ' + e.targetTouches.length)
    const n = e.targetTouches.length
    if(n==2){
        clear_touch_history()
        current_action=TOUCHACTION.NONE
        push_touch_history(touch2_features(e.targetTouches[0],e.targetTouches[1]))
    }
}

/**
 * 处理手势识别
 * @param e 
 */
function touchmove_handler(e:TouchEvent){
    print_log('touchmove ' + e.targetTouches.length)
    const n = e.targetTouches.length
    if(n==2){
        const tf = touch2_features(e.targetTouches[0],e.targetTouches[1])
        if(current_action==TOUCHACTION.NONE){
            current_action = push_touch_history(tf)
            if(current_action!=TOUCHACTION.NONE){
                init_view_manip()
            }
        }else if(current_action==TOUCHACTION.TRANS){
            drag_view(tf.cen)
        }else if(current_action==TOUCHACTION.SCALE){
            scale_view_2(tf.cen,tf.dis/tf_history[0].dis)
        }else if(current_action==TOUCHACTION.ROTATE){
            rotate_view_clockwise_2(tf_history[0].cen, p2d_rad_counterclockwise(tf_history[0].vec, tf.vec))
        }
    }
}

/**
 * 处理手势识别
 * @param e 
 */
function touchend_handler(e:TouchEvent){
    print_log('touchend ' + e.changedTouches.length)
    current_action = TOUCHACTION.NONE
    round_view_rotation(tf_history[0].cen, Math.PI/180*45)
}

/**
 * 处理手势识别
 * @param e 
 */
function touchcancel_handler(e:TouchEvent){
    print_log('touchcancel ' + e.targetTouches.length)
    current_action = TOUCHACTION.NONE
    round_view_rotation(tf_history[0].cen, Math.PI/180*45)
}


interface Touch2Features{
    p0:p2d
    p1:p2d
    cen:p2d
    dis:number
    vec:p2d
}

const tf_history:Array<Touch2Features> = []

let current_action = TOUCHACTION.NONE


function touch2_features(t0:Touch, t1:Touch):Touch2Features{
    const pt0 = touch_to_pointer(t0)
    const pt1 = touch_to_pointer(t1)
    const p0 = {x:pt0.offsetX,y:pt0.offsetY}
    const p1 = {x:pt1.offsetX,y:pt1.offsetY}
    const cen = p2d_mul(p2d_add(p0,p1),0.5)
    const dis = p2d_distance(p0,p1)
    const vec = p2d_vec(p0,p1)

    return {p0:p0,p1:p1,cen:cen,dis:dis,vec:vec}
}

function clear_touch_history(){
    tf_history.length = 0
}

function push_touch_history(tf:Touch2Features){
    tf_history.push(tf)

    const n = tf_history.length

    const current = tf_history[n-1]
    const origin = tf_history[0]

    let f_scale = Math.abs(current.dis/(origin.dis+1e-6)-1)
    f_scale /= 0.1
    let f_deg = Math.abs(p2d_rad_counterclockwise(origin.vec,current.vec))/Math.PI*180
    f_deg /= 5
    let f_pos = p2d_distance(origin.cen,current.cen)
    f_pos /= 5

    let score_scale = f_scale - f_deg
    let score_rotate = f_deg - f_scale
    let score_trans = f_pos - f_scale - f_deg

    // print_log(p2d_to_string(current.cen))
    // print_log("score_rotate: "+score_rotate)

    let max_score = 0
    let act = TOUCHACTION.NONE
    if(score_trans>0.5){
        act = TOUCHACTION.TRANS
        max_score = score_trans
    }

    if(score_scale>0.5 && score_scale>max_score){
        act = TOUCHACTION.SCALE
        max_score = score_scale
    }

    if(score_rotate>0.5 && score_rotate>max_score){
        act = TOUCHACTION.ROTATE
        max_score = score_rotate
    }

    return act
}

function init_view_manip(){
    const tf_start = tf_history[0]
    if(current_action==TOUCHACTION.TRANS){
        start_dragging_view(tf_start.cen)
    }else if(current_action==TOUCHACTION.SCALE){
        start_scale_view_2()
    }else if(current_action==TOUCHACTION.ROTATE){
        start_rotate_view_2()
    }
}
