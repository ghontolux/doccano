<template>
  <layout-text v-if="doc.id">
    <template #header>
      <toolbar-laptop
        :doc-id="doc.id"
        :enable-auto-labeling.sync="enableAutoLabeling"
        :guideline-text="project.guideline"
        :is-reviewd="doc.isConfirmed"
        :show-approve-button="project.permitApprove"
        :total="docs.count"
        class="d-none d-sm-block"
        @click:clear-label="clear"
        @click:review="confirm"
      />
      <toolbar-mobile
        :total="docs.count"
        class="d-flex d-sm-none"
      />
    </template>
    <template #content>
      <v-card>
        <v-card-text class="title">
          <entity-item-box
            :labels="labels"
            :text="doc.text"
            :entities="annotations"
            :delete-annotation="remove"
            :update-entity="update"
            :add-entity="add"
          />
        </v-card-text>
      </v-card>
    </template>
    <template #sidebar>
      <list-metadata :metadata="doc.meta" />
    </template>
  </layout-text>
</template>

<script>
import _ from 'lodash'
import {mapGetters} from 'vuex'
import LayoutText from '@/components/tasks/layout/LayoutText'
import ListMetadata from '@/components/tasks/metadata/ListMetadata'
import ToolbarLaptop from '@/components/tasks/toolbar/ToolbarLaptop'
import ToolbarMobile from '@/components/tasks/toolbar/ToolbarMobile'
import EntityItemBox from '~/components/tasks/entityRecognition/EntityItemBox'

const NONE = {
  id: -1,
  none: true
};

export default {

  components: {
    EntityItemBox,
    LayoutText,
    ListMetadata,
    ToolbarLaptop,
    ToolbarMobile
  },
  layout: 'workspace',

  data() {
    return {
      annotations: [],
      docs: [],
      labels: [],
      project: {},
      enableAutoLabeling: false,
    }
  },

  async fetch() {
    this.docs = await this.$services.example.fetchOne(
      this.projectId,
      this.$route.query.page,
      this.$route.query.q,
      this.$route.query.isChecked
    )
    const doc = this.docs.items[0]
    if (this.enableAutoLabeling) {
      await this.autoLabel(doc.id)
    }
    await this.list(doc.id)
  },

  computed: {
    ...mapGetters('auth', ['isAuthenticated', 'getUsername', 'getUserId']),

    projectId() {
      return this.$route.params.id
    },
    doc() {
      if (_.isEmpty(this.docs) || this.docs.items.length === 0) {
        return {}
      } else {
        return this.docs.items[0]
      }
    }
  },

  watch: {
    '$route.query': '$fetch',
    enableAutoLabeling(val) {
      if (val) {
        this.list(this.doc.id)
      }
    }
  },

  async created() {
    this.project = await this.$services.project.findById(this.projectId)
  },

  methods: {
    async list(docId) {

      const annotations = await this.$services.entityRecognition.list(this.projectId, docId);

      this.annotations = annotations;
    },

    async remove(id) {
      await this.$services.entityRecognition.delete(this.projectId, this.doc.id, id)
      await this.list(this.doc.id)
    },

    async add(startOffset, endOffset, entId) {
      await this.$services.entityRecognition.create(this.projectId, this.doc.id, entId, startOffset, endOffset)
      await this.list(this.doc.id)
    },

    async update(labelId, annotationId) {
      await this.$services.entityRecognition.changeLabel(this.projectId, this.doc.id, annotationId, labelId)
      await this.list(this.doc.id)
    },

    async clear() {
      await this.$services.entityRecognition.clear(this.projectId, this.doc.id)
      await this.list(this.doc.id)
    },

    async autoLabel(docId) {
      try {
        await this.$services.entityRecognition.autoLabel(this.projectId, docId)
      } catch (e) {
        console.log(e.response.data.detail)
      }
    },

    async confirm() {
      await this.$services.example.confirm(this.projectId, this.doc.id)
      await this.$fetch()
    },

  },

  validate({ params, query }) {
    return /^\d+$/.test(params.id) && /^\d+$/.test(query.page)
  }
}
</script>
