import { AnnotationRepository } from '@/domain/models/tasks/annotationRepository'
import { EntityRecognitionLabelingLabel } from '~/domain/models/tasks/entityRecognition'


export class APIEntityRecognitionRepository extends AnnotationRepository<EntityRecognitionLabelingLabel> {
  constructor() {
    super(EntityRecognitionLabelingLabel)
  }

  public async update(projectId: string, docId: number, annotationId: number, ent_id: string) {
    const url = this.baseUrl(projectId, docId) + `/${annotationId}`
    const payload = { ent_id }
    await this.request.patch(url, payload)
  }

  protected baseUrl(projectId: string, docId: number): string {
    return `/projects/${projectId}/docs/${docId}/annotations`
  }
}