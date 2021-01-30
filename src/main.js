import { LitElement, html } from 'lit-element';
import buildConfig from './buildConfig';
import style from './style';
import { createCard } from "card-tools/src/lovelace-element";
import { hass } from "card-tools/src/hass";
import './initialize';


class BootstrapGridCard extends LitElement {
  setConfig(config) {
    this._config = buildConfig(config, this.config);
    this.cards = [];
  }

  static get styles() {
    return style;
  }

  static get properties() {
    return {
      hass: {},
      _config: {},
    };
  }

  render() {
    return html`
    <div id="staging" class="${this._config.class || 'container-fluid'}">
    </div>
    `;
  }

  async updated(changedproperties) {
    if (!this.cards.length
      && (this._config.cards && this._config.cards.length)
    ) {
      // Build cards
      this.cards = await this.build_configured_cards();
      this.requestUpdate();
    }

    if (changedproperties.has("hass") && this.hass && this.cards) {
      // Update the hass object of every card in cards list (row cards excluded).
      for (const c of this.cards) {
        if (!c) continue;
        c.hass = this.hass;
      }
    }
  }

  async build_configured_cards() {
    // Clear out any cards in the staging area which might have been built but not placed
    const staging = this.shadowRoot.querySelector("#staging");
    while (staging.lastChild)
      staging.removeChild(staging.lastChild);

    return Promise.all(this.build_row(this._config.cards, staging));
  }

  build_row(cards, parent) {
    let builtCards = Array();
    cards.forEach(card => {
      if (card.type === 'row' || card.type === 'col') {
        if (!card.cards) {
          console.log('A card of type "row" or "col" must have "cards" list!');
          return; // Continue
        }

        let defaultClass = card.type === 'row' ? 'row' : "col";
        let newEl = document.createElement("div");
        newEl.className = card.class || '';
        if (!newEl.className.includes(defaultClass)) {
          newEl.className = `${defaultClass} ${newEl.className}`;
        }
        builtCards.push(...this.build_row(card.cards, newEl));
        parent.appendChild(newEl);
      } else {
          builtCards.push(this.build_card(parent, card));
      }
    });
    return builtCards;
  }

  async build_card(rowEl, card) {
    let colEl = document.createElement("div");
    const config = { ...card, ...this._config.card_options };
    colEl.className = config.class || "col";
    const el = createCard(config);
    el.hass = hass();
    colEl.appendChild(el)
    rowEl.appendChild(colEl);
    return new Promise((resolve, reject) =>
      el.updateComplete
        ? el.updateComplete.then(() => resolve(el))
        : resolve(el)
    );
  }
}
if(!customElements.get('bootstrap-grid-card')) {
  customElements.define('bootstrap-grid-card', BootstrapGridCard);
}
