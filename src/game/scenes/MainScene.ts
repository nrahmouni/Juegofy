import Phaser from 'phaser';
import { eventBus } from '../EventBus';

/**
 * MainScene – Isla Mágica (prototipo)
 * - Movimiento top-down con Arcade Physics
 * - NPCs: Manzano + Panadero
 * - Interacción contextual (acercarse + espacio / botón acción)
 * - Emite eventos al inventario React
 */

const TILE = 32;

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private actionKey!: Phaser.Input.Keyboard.Key;
  private nearbyTarget: Phaser.GameObjects.GameObject | null = null;
  private interactLabel!: Phaser.GameObjects.Text;
  private lang = 'es';

  // Placeholders de NPCs / objetos
  private appleTree!: Phaser.Physics.Arcade.Sprite;
  private baker!: Phaser.Physics.Arcade.Sprite;
  private trees: Phaser.Physics.Arcade.StaticGroup | null = null;

  constructor() {
    super({ key: 'MainScene' });
  }

  init() {
    this.lang = (this.registry.get('lang') as string) || 'es';
  }

  preload() {
    // Placeholders generados en runtime (no necesitamos assets externos aún)
  }

  create() {
    const { width, height } = this.scale;

    // Fondo hierba
    this.add.rectangle(width / 2, height / 2, width, height, 0x4ade80);

    // Camino simple
    this.add.rectangle(width / 2, height / 2, 80, height, 0xd4a574).setDepth(0);

    // Grupo de obstáculos (árboles decorativos)
    this.trees = this.physics.add.staticGroup();
    for (let i = 0; i < 8; i++) {
      const tx = Phaser.Math.Between(40, width - 40);
      const ty = Phaser.Math.Between(40, height - 40);
      // evitar el centro
      if (Math.abs(tx - width / 2) < 60) continue;
      const tree = this.add.rectangle(tx, ty, 28, 36, 0x166534).setStrokeStyle(2, 0x14532d);
      this.physics.add.existing(tree, true);
      this.trees.add(tree as any);
    }

    // Manzano (interactuable)
    this.appleTree = this.physics.add.sprite(width * 0.25, height * 0.35, undefined as any);
    this.appleTree.setDisplaySize(48, 56);
    // dibujar como rectángulo
    const treeGfx = this.add.rectangle(0, 0, 48, 56, 0x15803d).setStrokeStyle(3, 0x14532d);
    this.appleTree.setVisible(false);
    treeGfx.setPosition(this.appleTree.x, this.appleTree.y);
    (this.appleTree as any).visual = treeGfx;
    this.appleTree.setImmovable(true);
    this.appleTree.setData('type', 'apple_tree');
    this.appleTree.setData('label', this.t('apple_tree'));

    // Panadero
    this.baker = this.physics.add.sprite(width * 0.75, height * 0.4, undefined as any);
    this.baker.setDisplaySize(40, 48);
    const bakerGfx = this.add.rectangle(0, 0, 40, 48, 0xf59e0b).setStrokeStyle(3, 0xb45309);
    this.baker.setVisible(false);
    bakerGfx.setPosition(this.baker.x, this.baker.y);
    (this.baker as any).visual = bakerGfx;
    this.baker.setImmovable(true);
    this.baker.setData('type', 'baker');
    this.baker.setData('label', this.t('baker'));

    // Jugador
    this.player = this.physics.add.sprite(width / 2, height * 0.8, undefined as any);
    this.player.setDisplaySize(28, 36);
    this.player.setCollideWorldBounds(true);
    const playerGfx = this.add.rectangle(0, 0, 28, 36, 0x3b82f6).setStrokeStyle(3, 0x1d4ed8);
    this.player.setVisible(false);
    (this.player as any).visual = playerGfx;

    // Colisiones
    this.physics.add.collider(this.player, this.trees);
    this.physics.add.collider(this.player, this.appleTree);
    this.physics.add.collider(this.player, this.baker);

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.actionKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Label de interacción flotante
    this.interactLabel = this.add
      .text(0, 0, '', {
        fontSize: '14px',
        fontFamily: 'system-ui, sans-serif',
        color: '#0f172a',
        backgroundColor: '#fef3c7',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5, 1)
      .setDepth(20)
      .setVisible(false);

    // Botón de acción táctil (móvil)
    const actionBtn = this.add
      .circle(width - 56, height - 56, 32, 0xfbbf24)
      .setStrokeStyle(4, 0xb45309)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)
      .setDepth(30);
    this.add
      .text(width - 56, height - 56, 'A', {
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#0f172a',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(31);

    actionBtn.on('pointerdown', () => this.tryInteract());

    // Cámara
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.1);
  }

  update() {
    if (!this.player) return;

    const speed = 160;
    let vx = 0;
    let vy = 0;

    if (this.cursors.left?.isDown) vx = -speed;
    else if (this.cursors.right?.isDown) vx = speed;
    if (this.cursors.up?.isDown) vy = -speed;
    else if (this.cursors.down?.isDown) vy = speed;

    this.player.setVelocity(vx, vy);

    // Sincronizar visuales
    const pVis = (this.player as any).visual as Phaser.GameObjects.Rectangle;
    if (pVis) pVis.setPosition(this.player.x, this.player.y);
    const tVis = (this.appleTree as any).visual as Phaser.GameObjects.Rectangle;
    if (tVis) tVis.setPosition(this.appleTree.x, this.appleTree.y);
    const bVis = (this.baker as any).visual as Phaser.GameObjects.Rectangle;
    if (bVis) bVis.setPosition(this.baker.x, this.baker.y);

    // Detectar cercanía
    this.nearbyTarget = null;
    const targets = [this.appleTree, this.baker];
    for (const t of targets) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, t.x, t.y);
      if (dist < 55) {
        this.nearbyTarget = t;
        break;
      }
    }

    if (this.nearbyTarget) {
      const label = (this.nearbyTarget as any).getData('label') || '';
      this.interactLabel.setText(`${label}  [Espacio]`);
      this.interactLabel.setPosition(
        (this.nearbyTarget as any).x,
        (this.nearbyTarget as any).y - 40
      );
      this.interactLabel.setVisible(true);
    } else {
      this.interactLabel.setVisible(false);
    }

    // Acción con teclado
    if (Phaser.Input.Keyboard.JustDown(this.actionKey)) {
      this.tryInteract();
    }
  }

  private tryInteract() {
    if (!this.nearbyTarget) return;

    const type = (this.nearbyTarget as any).getData('type');

    if (type === 'apple_tree') {
      // Recolectar manzana
      eventBus.emit('item:collected', {
        id: 'apple',
        name: this.t('apple'),
        icon: '🍎',
      });
      eventBus.emit('dialogue:show', {
        speaker: this.t('apple_tree'),
        text: this.t('got_apple'),
      });
      // Feedback visual rápido
      this.tweens.add({
        targets: (this.appleTree as any).visual,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 120,
        yoyo: true,
      });
    }

    if (type === 'baker') {
      eventBus.emit('dialogue:show', {
        speaker: this.t('baker'),
        text: this.t('baker_quest'),
      });
      eventBus.emit('quest:updated', { id: 'baker_apples', status: 'active' });
    }
  }

  /** Traducciones mínimas embebidas (luego se conecta a i18next) */
  private t(key: string): string {
    const dict: Record<string, Record<string, string>> = {
      es: {
        apple_tree: 'Manzano',
        baker: 'Panadero',
        apple: 'Manzana',
        got_apple: '¡Has cogido una manzana!',
        baker_quest: 'Necesito 2 manzanas para hacer un pastel.',
      },
      en: {
        apple_tree: 'Apple Tree',
        baker: 'Baker',
        apple: 'Apple',
        got_apple: 'You picked an apple!',
        baker_quest: 'I need 2 apples to make a pie.',
      },
      fr: {
        apple_tree: 'Pommier',
        baker: 'Boulanger',
        apple: 'Pomme',
        got_apple: 'Tu as pris une pomme !',
        baker_quest: "J'ai besoin de 2 pommes pour faire une tarte.",
      },
      nl: {
        apple_tree: 'Appelboom',
        baker: 'Bakker',
        apple: 'Appel',
        got_apple: 'Je hebt een appel geplukt!',
        baker_quest: 'Ik heb 2 appels nodig voor een taart.',
      },
    };
    return dict[this.lang]?.[key] || dict.es[key] || key;
  }
}
