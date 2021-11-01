<template>
  <div id="connections-wrapper">
    <div class="highlight-container highlight-container--bottom-labels" @click="open" @touchend="open">
      <entity-item
          v-for="(chunk, i) in chunks"
          :key="i"
          :spanid="chunk.id"
          :content="chunk.text"
          :newline="chunk.newline"
          :label="chunk.label"
          :color="defaultColor"
          @remove="deleteAnnotation(chunk.id)"
          @update="updateEntity($event.id, chunk.id)"
      />
      <v-menu
          v-model="showMenu"
          :nudge-width="300"
          :close-on-content-click="false"
          :position-x="x"
          :position-y="y"
          absolute
          offset-y
      >
        <v-card>
        <v-autocomplete
            v-model="model"
            :items="items"
            :loading="isLoading"
            :search-input.sync="search"
            color="grey"
            filled
            hide-selected
            no-filter
            item-text="uri"
            item-value="API"
            label="Entity ID"
            placeholder="Entity Surface"
            prepend-icon="mdi-database-search"
            return-object
            autofocus
            @focus="setSearchVal"
        >
          <template #item="data">
            <v-list-item-title style="white-space: pre-wrap;" v-text="data.item.label"></v-list-item-title>
            <v-list-item-subtitle v-text="data.item.type"></v-list-item-subtitle>
          </template>
        </v-autocomplete>
      <v-divider></v-divider>
      <v-expand-transition>
        <v-list
          v-if="model"
          class="cyan lighten-5"
        >
          <v-list-item
            v-for="(field, i) in fields"
            :key="i"
          >
            <v-list-item-content>
              <v-list-item-title v-text="field.value"></v-list-item-title>
              <v-list-item-subtitle v-text="field.key"></v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-expand-transition>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          :disabled="!model"
          color="red lighten-4"
          @click="model = null"
        >
          Clear
          <v-icon right>
            mdi-close-circle
          </v-icon>
        </v-btn>
      </v-card-actions>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click="onCancel()"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            text
            @click="onSubmit()"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
      </v-menu>

    </div>

    <canvas id="connections">
    </canvas>
  </div>
</template>

<script>
import { chunk } from 'lodash'
import EntityItem from './EntityItem'

export default {
  components: {
    EntityItem
  },

  props: {
    text: {
      type: String,
      default: '',
      required: true
    },
    entities: {
      type: Array,
      default: () => ([]),
      required: true
    },
    deleteAnnotation: {
      type: Function,
      default: () => ([]),
      required: true
    },
    updateEntity: {
      type: Function,
      default: () => ([]),
      required: true
    },
    addEntity: {
      type: Function,
      default: () => ([]),
      required: true
    },
  },

  data() {
    return {
      showMenu: false,
      x: 0,
      y: 0,
      start: 0,
      end: 0,
      entInput: "",
      defaultColor: "#9CCC65",

      // Autocomplete
      descriptionLimit: 60,
      entries: [],
      isLoading: false,
      model: null,
      search: "",
    }
  },

  computed: {
    sortedEntities() {
      return this.entities.slice().sort((a, b) => a.startOffset - b.startOffset)
    },

    chunks() {
      let chunks = []
      let startOffset = 0
      // to count the number of characters correctly.
      const characters = [...this.text]
      for (const entity of this.sortedEntities) {
        // add non-entities to chunks.
        let piece = characters.slice(startOffset, entity.startOffset).join('')
        chunks = chunks.concat(this.makeChunks(piece))
        startOffset = entity.endOffset
        // add entities to chunks.
        piece = characters.slice(entity.startOffset, entity.endOffset).join('')
        chunks.push({
          id: entity.id,
          label: entity.ent_id,
          color: this.defaultColor,
          text: piece,
        })
      }
      // add the rest of text.
      chunks = chunks.concat(this.makeChunks(characters.slice(startOffset, characters.length).join('')));

      return chunks;
    },

    // autocomplete
    fields() {
      if (!this.model) return []

      return Object.keys(this.model).map(key => {
        return {
          key,
          value: this.model[key] || 'n/a',
        }
      })
    },
    items() {
      return this.entries.map(entry => {
        const Description = entry.label.length > this.descriptionLimit
          ? entry.label.slice(0, this.descriptionLimit) + '...'
          : entry.label
        return Object.assign({}, entry, { Description })
      })
    },
  },

  watch: {
      search(val) {
        // if the search value is empty
        if (val === undefined || val === null || val.length === 0) {
        // make dataList empty
          this.makeDataListEmpty();
          this.isloading = false;
          return;
        }

        // Items have already been loaded
        // if (this.items.length > 0) return
        // Items have already been requested
        if (this.isLoading) return
        this.isLoading = true
        // Lazily load input items
        const call_txt = "/txt-lexicon&sf=" + val
        this.fetchTxtEnts(call_txt)
      },
    },

  updated() {
    this.$nextTick(() => {
      const parentPos = document.getElementById('connections-wrapper').getBoundingClientRect();
      const canvas = document.getElementById('connections');
      canvas.width = parentPos.width;
      canvas.height = parentPos.height;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, parentPos.width, parentPos.height);
    });
  },

  methods: {
    splitSnippet(snippet, chunks, maxSnippetLength){
      const parts = snippet.split(" ")
          const tokens = []
          let partLength = 0
          let splitCount = 0
          for (const [j, part] of parts.entries()){
            tokens.push(part)
            partLength += part.length
            if (partLength >= maxSnippetLength || j === parts.length - 1){
              let words = tokens.join(" ")
              if (splitCount > 0){
                words = " " + words
              }
              chunks.push({
                label: null,
                color: null,
                text: words,
                newline: false
              })
              tokens.length = 0
              partLength = 0
              splitCount += 1
            }
          }
    },

    makeChunks(text) {
      const chunks = []
      const snippets = text.split("\n")
      const maxSnippetLength = 30

      for (const [i, snippet] of snippets.entries()) {
        if (snippet.length >= maxSnippetLength){
          this.splitSnippet(snippet, chunks, maxSnippetLength)
        } else {
            chunks.push({
              label: null,
              color: null,
              text: snippet,
              newline: false
            })
        }

        if (i !== snippets.length  - 1){
          chunks[chunks.length - 1].text += "\n"
          chunks.push({
              label: null,
              color: null,
              text: '',
              newline: true
          })
        }

        
      }

      return chunks
    },

    show(e) {
      e.preventDefault()
      this.showMenu = false
      this.x = e.clientX || e.changedTouches[0].clientX
      this.y = e.clientY || e.changedTouches[0].clientY
      this.$nextTick(() => {
        this.showMenu = true
      })
    },

    setSpanInfo() {
      let selection
      // Modern browsers.
      if (window.getSelection) {
        selection = window.getSelection()
      } else if (document.selection) {
        selection = document.selection
      }
      // If nothing is selected.
      if (selection.rangeCount <= 0) {
        return
      }
      const range = selection.getRangeAt(0)
      const preSelectionRange = range.cloneRange()
      preSelectionRange.selectNodeContents(this.$el)
      preSelectionRange.setEnd(range.startContainer, range.startOffset)
      this.start = [...preSelectionRange.toString()].length
      this.end = this.start + [...range.toString()].length
    },

    validateSpan() {
      if ((typeof this.start === 'undefined') || (typeof this.end === 'undefined')) {
        return false
      }
      if (this.start === this.end) {
        return false
      }
      for (const entity of this.entities) {
        if ((entity.startOffset <= this.start) && (this.start < entity.endOffset)) {
          return false
        }
        if ((entity.startOffset < this.end) && (this.end <= entity.endOffset)) {
          return false
        }
        if ((this.start < entity.startOffset) && (entity.endOffset < this.end)) {
          return false
        }
      }
      return true
    },

    open(e) {
      this.setSpanInfo()
      if (this.validateSpan()) {
        this.show(e)
      }
    },

    assignLabel() {
      if (this.validateSpan()) {
        this.addEntity(this.start, this.end, this.model.uri)
        this.showMenu = false
        this.start = 0
        this.end = 0
      }
    },

    onCancel(){
      this.showMenu = false;
      this.search = "";
    },
    
    onSubmit(){
      if (this.model){
        this.assignLabel(this.model.url)
      }
      this.showMenu = false;
      this.entInput = "";
    },

    setSearchVal(){
      this.search = this.text.slice(this.start, this.end)
      this.model = null
    },

    makeDataListEmpty(){
      this.entries = []
    },

    fetchTxtEnts(call_txt){
      fetch(
              call_txt, {
              headers: {}
            })
            .then(res => res.json())
            .then(res => {
              const entries = [].concat.apply([], res.map(lexicon => {
                return lexicon.results.map(lexEntry => {
                    lexEntry.lexicon = lexicon.lexicon
                    return lexEntry
                  })
                }
              ))
              if (
                      Array.isArray(entries) &&
                      entries.length)
              {
                  const count = entries.length
                  this.count = count
                  this.entries = entries
              }
              else {
                  this.count = 0
                  this.entries = []
              }
            })
            .catch(err => {
              console.log(err)
            })
            .finally(() => (this.isLoading = false))
    }
  },
}
</script>

<style scoped>
.highlight-container.highlight-container--bottom-labels {
  align-items: flex-start;
}

.highlight-container {
  line-height: 70px !important;
  display: flex;
  flex-wrap: wrap;
  white-space: pre;
  cursor: default;
  position: relative;
  z-index: 1;
}

.highlight-container.highlight-container--bottom-labels .highlight.bottom {
  margin-top: 6px;
}

.v-autocomplete:not(.v-input--is-focused).v-select--chips input {
   max-height: 25px !important; 
}

#connections-wrapper {
  position: relative;
}

#connections-wrapper canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}
</style>
