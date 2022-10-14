
export interface p2d{
    x:number
    y:number
}

export function p2d_to_string(p:p2d){
    return '('+p.x+','+p.y+')'
}

export function p2d_distance(p0:p2d,p1:p2d){
    return Math.sqrt((p0.x-p1.x)*(p0.x-p1.x)+(p0.y-p1.y)*(p0.y-p1.y))
}

export function p2d_len(p:p2d){
    return p2d_distance(p,{x:0,y:0})
}

export function p2d_add(p0:p2d,p1:p2d){
    return {x:p0.x+p1.x,y:p0.y+p1.y}
}

export function p2d_mul(p:p2d,a:number){
    return {x:p.x*a,y:p.y*a}
}

export function p2d_vec(p0:p2d,p1:p2d){
    return {x:p1.x-p0.x,y:p1.y-p0.y}
}

export function p2d_cross(v0:p2d,v1:p2d){
    return v0.x*v1.y - v0.y*v1.x
}

export function p2d_rad_counterclockwise(v0:p2d,v1:p2d){
    return Math.asin(p2d_cross(v0,v1)/(p2d_len(v0)*p2d_len(v1)+1e-6))
}