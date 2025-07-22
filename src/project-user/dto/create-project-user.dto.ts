import { ProjectUserRoleEnum } from '../constants';

export class CreateProjectUserDto {
  projectId: string;
  userId: string;
  role: ProjectUserRoleEnum;
  deleted?: boolean;
  deletedAt?: Date;
}
