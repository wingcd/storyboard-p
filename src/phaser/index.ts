export import Game = Phaser.Game;
export import Scene = Phaser.Scene;
export import Container = Phaser.GameObjects.Container;
export import GameObject = Phaser.GameObjects.GameObject;
export import Rectangle = Phaser.Geom.Rectangle;
export import Point = Phaser.Geom.Point;
export import Graphics = Phaser.GameObjects.Graphics;
export import Sprite = Phaser.GameObjects.Sprite;
export import Texture = Phaser.Textures.Texture;
export import EventEmitter = Phaser.Events.EventEmitter;
export import TileSprite = Phaser.GameObjects.TileSprite;
export import Size = Phaser.Structs.Size;
export import Scale = Phaser.Scale;
export import Pointer = Phaser.Input.Pointer;
export import EventData	= Phaser.Types.Input.EventData;
export import Vector2 = Phaser.Math.Vector2;
export import TransformMatrix = Phaser.GameObjects.Components.TransformMatrix;
export import BitmapMask = Phaser.Display.Masks.BitmapMask;
export import GeometryMask = Phaser.Display.Masks.GeometryMask;
export import Input = Phaser.Input;
export import Time = Phaser.Time;
export import PMath = Phaser.Math;

export import Easing = Phaser.Math.Easing;
export import Tweens = Phaser.Tweens;
export import Tween = Phaser.Tweens.Tween;
export import Timeline = Phaser.Tweens.Timeline;
export import Types = Phaser.Types;
export import Color = Phaser.Display.Color;

require('./patches/GameObjectFactoryPatch');
require('./patches/GameObjectCreatorPatch');

export import BitmapText = Phaser.GameObjects.BitmapText;
export * from './patches/TextPatch';

export type MaskType = BitmapMask | GeometryMask;
export * from './extends/GameObjectFactoryExt';

export * from './plugins/StageScalePlugin';
require('./patches/TweenPatch');

(window as any).BBCodeText = (require('../libs/rex/bbcodetext.js').default as any);
(window as any).TextTyping = (require('../libs/rex/texttyping.js').default as any);
(window as any).NinePatch = (require('../libs/rex/ninepatch.js').default as any);