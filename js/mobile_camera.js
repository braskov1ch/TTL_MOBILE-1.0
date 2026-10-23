'use strict';
// Camera geometry is independent of device pixels and gameplay coordinates.
class MobileCamera {
  reset() { this.rect = null; this.room = null; this.lastTime = null; }
  update(width, height, player, room, now) {
    const ratio = Math.max(1, width) / Math.max(1, height);
    const h = Math.min(H - HUD_H, Math.max(360, height / .85), W / ratio);
    const w = h * ratio;
    const look = Math.min(36, w * .06);
    const px = player ? player.x + Math.cos(player.aimAng || 0) * look : CX;
    const py = player ? player.y + Math.sin(player.aimAng || 0) * look : CY;
    const target = {x:clamp(px-w/2,0,W-w), y:clamp(py-h/2,HUD_H,H-h), w,h};
    const snap = !this.rect || room !== this.room || Math.abs(this.rect.w-w)>1 || Math.abs(this.rect.h-h)>1;
    const dt = Math.max(0, Math.min(.05, now-(this.lastTime ?? now)));
    const k = 1-Math.exp(-dt*10);
    this.rect = snap ? target : {x:lerp(this.rect.x,target.x,k),y:lerp(this.rect.y,target.y,k),w,h};
    this.room=room; this.lastTime=now;
    return this.rect;
  }
}
