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
          :color="chunk.color"
          :labels="labels"
          :source-chunk="sourceChunk"
          @remove="deleteAnnotation(chunk.id)"
          @update="updateEntity($event.id, chunk.id)"
          @selectSource="selectSource(chunk)"
          @selectTarget="selectTarget(chunk)"
      />
      <v-menu
          v-model="showMenu"
          :close-on-content-click="false"
          :position-x="x"
          :position-y="y"
          absolute
          offset-y
      >
        <v-card>
        <v-text-field
            v-model="input"
            label="Entity ID"
          ></v-text-field>
        
        <v-divider></v-divider>
        


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
    labels: {
      type: Array,
      default: () => ([]),
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
    sourceChunk: {
      type: Object,
      default: () => {
      },
      required: true
    },
    selectSource: {
      type: Function,
      default: () => ([]),
      required: true
    },
    selectTarget: {
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
      end: 0
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
        const label = this.labelObject[entity.label]
        piece = characters.slice(entity.startOffset, entity.endOffset).join('')
        chunks.push({
          id: entity.id,
          label: label.text,
          color: label.backgroundColor,
          text: piece,
        })
      }
      // add the rest of text.
      chunks = chunks.concat(this.makeChunks(characters.slice(startOffset, characters.length).join('')));


      return chunks;
    },

    labelObject() {
      const obj = {}
      for (const label of this.labels) {
        obj[label.id] = label
      }
      return obj
    }
  },

  updated() {
    this.$nextTick(() => {
      const parentPos = document.getElementById('connections-wrapper').getBoundingClientRect();
      const canvas = document.getElementById('connections');
      canvas.width = parentPos.width;
      canvas.height = parentPos.height;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, parentPos.width, parentPos.height);

      const topPoints = this.drawnCountPoints(this.chunks.length);
      const bottomPoints = this.drawnCountPoints(this.chunks.length);

      const chunks = this.chunks;

    });
  },

  methods: {
    makeChunks(text) {
      const chunks = []
      const snippets = text.split('\n')
      for (const snippet of snippets.slice(0, -1)) {
        chunks.push({
          label: null,
          color: null,
          text: snippet + '\n',
          newline: false
        })
        chunks.push({
          label: null,
          color: null,
          text: '',
          newline: true
        })
      }
      chunks.push({
        label: null,
        color: null,
        text: snippets.slice(-1)[0],
        newline: false
      })
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

    assignLabel(labelId) {
      if (this.validateSpan()) {
        this.addEntity(this.start, this.end, labelId)
        this.showMenu = false
        this.start = 0
        this.end = 0
      }
    },

    drawnCountPoints(size) {
      const points = Array(size);

      for (let i = 0; i < points.length; i++) {
        points[i] = {
          drawn: 0,
          count: 0
        }
      }

      return points;
    },
    onCancel(){
      this.showMenu = false;
      this.input = "";
    },
    onSubmit(){
      this.showMenu = false;
    }
  }
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
  white-space: pre-wrap;
  cursor: default;
  position: relative;
  z-index: 1;
}

.highlight-container.highlight-container--bottom-labels .highlight.bottom {
  margin-top: 6px;
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
