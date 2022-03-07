import { AnnotationRepository } from '@/domain/models/tasks/annotationRepository'
import { EntityLinkingLabel } from '~/domain/models/tasks/entityLinking'


export class APIEntityLinkingRepository extends AnnotationRepository<EntityLinkingLabel> {
  constructor() {
    super(EntityLinkingLabel)
  }

  public async update(projectId: string, docId: number, annotationId: number, ent_id: string) {
    const url = this.baseUrl(projectId, docId) + `/${annotationId}`
    const payload = { ent_id }
    await this.request.patch(url, payload)
  }

  protected baseUrl(projectId: string, docId: number): string {
    return `/projects/${projectId}/examples/${docId}/entityspans`
  }
}