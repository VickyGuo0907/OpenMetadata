/*
 *  Copyright 2021 Collate
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import { AxiosError, AxiosResponse } from 'axios';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import {
  getDashboardByFqn,
  getDashboardVersion,
  getDashboardVersions,
} from '../../axiosAPIs/dashboardAPI';
import {
  getPipelineByFqn,
  getPipelineVersion,
  getPipelineVersions,
} from '../../axiosAPIs/pipelineAPI';
import {
  getTableDetailsByFQN,
  getTableVersion,
  getTableVersions,
} from '../../axiosAPIs/tableAPI';
import {
  getTopicByFqn,
  getTopicVersion,
  getTopicVersions,
} from '../../axiosAPIs/topicsAPI';
import { TitleBreadcrumbProps } from '../../components/common/title-breadcrumb/title-breadcrumb.interface';
import DashboardVersion from '../../components/DashboardVersion/DashboardVersion.component';
import DatasetVersion from '../../components/DatasetVersion/DatasetVersion.component';
import Loader from '../../components/Loader/Loader';
import PipelineVersion from '../../components/PipelineVersion/PipelineVersion.component';
import TopicVersion from '../../components/TopicVersion/TopicVersion.component';
import { FQN_SEPARATOR_CHAR } from '../../constants/char.constants';
import {
  getDashboardDetailsPath,
  getDatabaseDetailsPath,
  getDatabaseSchemaDetailsPath,
  getPipelineDetailsPath,
  getServiceDetailsPath,
  getTableDetailsPath,
  getTopicDetailsPath,
  getVersionPath,
} from '../../constants/constants';
import { EntityType, FqnPart } from '../../enums/entity.enum';
import { ServiceCategory } from '../../enums/service.enum';
import { Dashboard } from '../../generated/entity/data/dashboard';
import { Pipeline } from '../../generated/entity/data/pipeline';
import { Table } from '../../generated/entity/data/table';
import { Topic } from '../../generated/entity/data/topic';
import { EntityHistory } from '../../generated/type/entityHistory';
import { TagLabel } from '../../generated/type/tagLabel';
import {
  getEntityName,
  getPartialNameFromFQN,
  getPartialNameFromTableFQN,
} from '../../utils/CommonUtils';
import { serviceTypeLogo } from '../../utils/ServiceUtils';
import { getOwnerFromId, getTierTags } from '../../utils/TableUtils';
import { showErrorToast } from '../../utils/ToastUtils';

export type VersionData = Partial<Table> &
  Partial<Topic> &
  Partial<Dashboard> &
  Partial<Pipeline>;

const EntityVersionPage: FunctionComponent = () => {
  const history = useHistory();
  const [tier, setTier] = useState<TagLabel>();
  const [owner, setOwner] = useState<
    Table['owner'] & { displayName?: string }
  >();
  const [currentVersionData, setCurrentVersionData] = useState<VersionData>(
    {} as VersionData
  );

  const { entityType, version, entityFQN } = useParams() as Record<
    string,
    string
  >;
  const [isLoading, setIsloading] = useState<boolean>(false);
  const [versionList, setVersionList] = useState<EntityHistory>(
    {} as EntityHistory
  );
  const [isVersionLoading, setIsVersionLoading] = useState<boolean>(false);
  const [slashedEntityName, setSlashedEntityName] = useState<
    TitleBreadcrumbProps['titleLinks']
  >([]);

  const backHandler = () => {
    switch (entityType) {
      case EntityType.TABLE:
        history.push(getTableDetailsPath(entityFQN));

        break;

      case EntityType.TOPIC:
        history.push(getTopicDetailsPath(entityFQN));

        break;

      case EntityType.DASHBOARD:
        history.push(getDashboardDetailsPath(entityFQN));

        break;

      case EntityType.PIPELINE:
        history.push(getPipelineDetailsPath(entityFQN));

        break;

      default:
        break;
    }
  };

  const versionHandler = (v = version) => {
    history.push(getVersionPath(entityType, entityFQN, v as string));
  };

  const setEntityState = (
    tags: TagLabel[],
    owner: Table['owner'],
    data: VersionData,
    titleBreadCrumb: TitleBreadcrumbProps['titleLinks']
  ) => {
    setTier(getTierTags(tags));
    setOwner(getOwnerFromId(owner?.id));
    setCurrentVersionData(data);
    setSlashedEntityName(titleBreadCrumb);
  };

  const fetchEntityVersions = () => {
    setIsloading(true);
    switch (entityType) {
      case EntityType.TABLE: {
        getTableDetailsByFQN(
          getPartialNameFromTableFQN(
            entityFQN,
            [FqnPart.Service, FqnPart.Database, FqnPart.Schema, FqnPart.Table],
            FQN_SEPARATOR_CHAR
          ),
          ['owner', 'tags']
        )
          .then((res: AxiosResponse) => {
            const {
              id,
              owner,
              tags,
              database,
              service,
              serviceType,
              databaseSchema,
            } = res.data;
            setEntityState(tags, owner, res.data, [
              {
                name: service.name,
                url: service.name
                  ? getServiceDetailsPath(
                      service.name,
                      ServiceCategory.DATABASE_SERVICES
                    )
                  : '',
                imgSrc: serviceType ? serviceTypeLogo(serviceType) : undefined,
              },
              {
                name: getPartialNameFromTableFQN(database.fullyQualifiedName, [
                  FqnPart.Database,
                ]),
                url: getDatabaseDetailsPath(database.fullyQualifiedName),
              },
              {
                name: getPartialNameFromTableFQN(
                  databaseSchema.fullyQualifiedName,
                  [FqnPart.Schema]
                ),
                url: getDatabaseSchemaDetailsPath(
                  databaseSchema.fullyQualifiedName
                ),
              },
              {
                name: getEntityName(res.data),
                url: '',
                activeTitle: true,
              },
            ]);

            getTableVersions(id)
              .then((vres: AxiosResponse) => {
                setVersionList(vres.data);
                setIsloading(false);
              })
              .catch((err: AxiosError) => {
                showErrorToast(
                  err,
                  `Error while fetching ${entityFQN} versions`
                );
              });
          })
          .catch((err: AxiosError) => {
            showErrorToast(err, `Error while fetching ${entityFQN} versions`);
          });

        break;
      }
      case EntityType.TOPIC: {
        getTopicByFqn(
          getPartialNameFromFQN(
            entityFQN,
            ['service', 'database'],
            FQN_SEPARATOR_CHAR
          ),
          ['owner', 'tags']
        )
          .then((res: AxiosResponse) => {
            const { id, owner, tags, service, serviceType } = res.data;
            setEntityState(tags, owner, res.data, [
              {
                name: service.name,
                url: service.name
                  ? getServiceDetailsPath(
                      service.name,
                      ServiceCategory.MESSAGING_SERVICES
                    )
                  : '',
                imgSrc: serviceType ? serviceTypeLogo(serviceType) : undefined,
              },
              {
                name: getEntityName(res.data),
                url: '',
                activeTitle: true,
              },
            ]);

            getTopicVersions(id)
              .then((vres: AxiosResponse) => {
                setVersionList(vres.data);
                setIsloading(false);
              })
              .catch((err: AxiosError) => {
                showErrorToast(
                  err,
                  `Error while fetching ${entityFQN} versions`
                );
              });
          })
          .catch((err: AxiosError) => {
            showErrorToast(err, `Error while fetching ${entityFQN} versions`);
          });

        break;
      }
      case EntityType.DASHBOARD: {
        getDashboardByFqn(
          getPartialNameFromFQN(
            entityFQN,
            ['service', 'database'],
            FQN_SEPARATOR_CHAR
          ),
          ['owner', 'tags', 'charts']
        )
          .then((res: AxiosResponse) => {
            const { id, owner, tags, service, serviceType } = res.data;
            setEntityState(tags, owner, res.data, [
              {
                name: service.name,
                url: service.name
                  ? getServiceDetailsPath(
                      service.name,
                      ServiceCategory.DASHBOARD_SERVICES
                    )
                  : '',
                imgSrc: serviceType ? serviceTypeLogo(serviceType) : undefined,
              },
              {
                name: getEntityName(res.data),
                url: '',
                activeTitle: true,
              },
            ]);

            getDashboardVersions(id)
              .then((vres: AxiosResponse) => {
                setVersionList(vres.data);
                setIsloading(false);
              })
              .catch((err: AxiosError) => {
                showErrorToast(
                  err,
                  `Error while fetching ${entityFQN} versions`
                );
              });
          })
          .catch((err: AxiosError) => {
            showErrorToast(err, `Error while fetching ${entityFQN} versions`);
          });

        break;
      }
      case EntityType.PIPELINE: {
        getPipelineByFqn(
          getPartialNameFromFQN(
            entityFQN,
            ['service', 'database'],
            FQN_SEPARATOR_CHAR
          ),
          ['owner', 'tags', 'tasks']
        )
          .then((res: AxiosResponse) => {
            const { id, owner, tags, service, serviceType } = res.data;
            setEntityState(tags, owner, res.data, [
              {
                name: service.name,
                url: service.name
                  ? getServiceDetailsPath(
                      service.name,
                      ServiceCategory.PIPELINE_SERVICES
                    )
                  : '',
                imgSrc: serviceType ? serviceTypeLogo(serviceType) : undefined,
              },
              {
                name: getEntityName(res.data),
                url: '',
                activeTitle: true,
              },
            ]);

            getPipelineVersions(id)
              .then((vres: AxiosResponse) => {
                setVersionList(vres.data);
                setIsloading(false);
              })
              .catch((err: AxiosError) => {
                showErrorToast(
                  err,
                  `Error while fetching ${entityFQN} versions`
                );
              });
          })
          .catch((err: AxiosError) => {
            showErrorToast(err, `Error while fetching ${entityFQN} versions`);
          });

        break;
      }

      default:
        break;
    }
  };

  const fetchCurrentVersion = () => {
    setIsVersionLoading(true);
    switch (entityType) {
      case EntityType.TABLE: {
        getTableDetailsByFQN(
          getPartialNameFromTableFQN(
            entityFQN,
            [FqnPart.Service, FqnPart.Database, FqnPart.Schema, FqnPart.Table],
            FQN_SEPARATOR_CHAR
          )
        )
          .then((res: AxiosResponse) => {
            const { id, database, service, serviceType, databaseSchema } =
              res.data;
            getTableVersion(id, version)
              .then((vRes: AxiosResponse) => {
                const { owner, tags } = vRes.data;
                setEntityState(tags, owner, vRes.data, [
                  {
                    name: service.name,
                    url: service.name
                      ? getServiceDetailsPath(
                          service.name,
                          ServiceCategory.DATABASE_SERVICES
                        )
                      : '',
                    imgSrc: serviceType
                      ? serviceTypeLogo(serviceType)
                      : undefined,
                  },
                  {
                    name: getPartialNameFromTableFQN(
                      database.fullyQualifiedName,
                      [FqnPart.Database]
                    ),
                    url: getDatabaseDetailsPath(database.fullyQualifiedName),
                  },
                  {
                    name: getPartialNameFromTableFQN(
                      databaseSchema.fullyQualifiedName,
                      [FqnPart.Schema]
                    ),
                    url: getDatabaseSchemaDetailsPath(
                      databaseSchema.fullyQualifiedName
                    ),
                  },
                  {
                    name: getEntityName(res.data),
                    url: '',
                    activeTitle: true,
                  },
                ]);
                setIsVersionLoading(false);
              })
              .catch((err: AxiosError) => {
                showErrorToast(
                  err,
                  `Error while fetching ${entityFQN} version ${version}`
                );
              });
          })
          .catch((err: AxiosError) => {
            showErrorToast(
              err,
              `Error while fetching ${entityFQN}  version ${version}`
            );
          });

        break;
      }

      case EntityType.TOPIC: {
        getTopicByFqn(
          getPartialNameFromFQN(
            entityFQN,
            ['service', 'database'],
            FQN_SEPARATOR_CHAR
          )
        )
          .then((res: AxiosResponse) => {
            const { id, service, serviceType } = res.data;
            getTopicVersion(id, version)
              .then((vRes: AxiosResponse) => {
                const { owner, tags } = vRes.data;
                setEntityState(tags, owner, vRes.data, [
                  {
                    name: service.name,
                    url: service.name
                      ? getServiceDetailsPath(
                          service.name,
                          ServiceCategory.MESSAGING_SERVICES
                        )
                      : '',
                    imgSrc: serviceType
                      ? serviceTypeLogo(serviceType)
                      : undefined,
                  },
                  {
                    name: getEntityName(res.data),
                    url: '',
                    activeTitle: true,
                  },
                ]);
                setIsVersionLoading(false);
              })
              .catch((err: AxiosError) => {
                showErrorToast(
                  err,
                  `Error while fetching ${entityFQN} version ${version}`
                );
              });
          })
          .catch((err: AxiosError) => {
            showErrorToast(
              err,
              `Error while fetching ${entityFQN}  version ${version}`
            );
          });

        break;
      }
      case EntityType.DASHBOARD: {
        getDashboardByFqn(
          getPartialNameFromFQN(
            entityFQN,
            ['service', 'database'],
            FQN_SEPARATOR_CHAR
          )
        )
          .then((res: AxiosResponse) => {
            const { id, service, serviceType } = res.data;
            getDashboardVersion(id, version)
              .then((vRes: AxiosResponse) => {
                const { owner, tags } = vRes.data;
                setEntityState(tags, owner, vRes.data, [
                  {
                    name: service.name,
                    url: service.name
                      ? getServiceDetailsPath(
                          service.name,
                          ServiceCategory.DASHBOARD_SERVICES
                        )
                      : '',
                    imgSrc: serviceType
                      ? serviceTypeLogo(serviceType)
                      : undefined,
                  },
                  {
                    name: getEntityName(res.data),
                    url: '',
                    activeTitle: true,
                  },
                ]);
                setIsVersionLoading(false);
              })
              .catch((err: AxiosError) => {
                showErrorToast(
                  err,
                  `Error while fetching ${entityFQN} version ${version}`
                );
              });
          })
          .catch((err: AxiosError) => {
            showErrorToast(
              err,
              `Error while fetching ${entityFQN}  version ${version}`
            );
          });

        break;
      }
      case EntityType.PIPELINE: {
        getPipelineByFqn(
          getPartialNameFromFQN(
            entityFQN,
            ['service', 'database'],
            FQN_SEPARATOR_CHAR
          )
        )
          .then((res: AxiosResponse) => {
            const { id, service, serviceType } = res.data;
            getPipelineVersion(id, version)
              .then((vRes: AxiosResponse) => {
                const { owner, tags } = vRes.data;
                setEntityState(tags, owner, vRes.data, [
                  {
                    name: service.name,
                    url: service.name
                      ? getServiceDetailsPath(
                          service.name,
                          ServiceCategory.PIPELINE_SERVICES
                        )
                      : '',
                    imgSrc: serviceType
                      ? serviceTypeLogo(serviceType)
                      : undefined,
                  },
                  {
                    name: getEntityName(res.data),
                    url: '',
                    activeTitle: true,
                  },
                ]);
                setIsVersionLoading(false);
              })
              .catch((err: AxiosError) => {
                showErrorToast(
                  err,
                  `Error while fetching ${entityFQN} version ${version}`
                );
              });
          })
          .catch((err: AxiosError) => {
            showErrorToast(
              err,
              `Error while fetching ${entityFQN}  version ${version}`
            );
          });

        break;
      }

      default:
        break;
    }
  };

  const versionComponent = () => {
    switch (entityType) {
      case EntityType.TABLE: {
        return (
          <DatasetVersion
            backHandler={backHandler}
            currentVersionData={currentVersionData}
            datasetFQN={entityFQN}
            deleted={currentVersionData.deleted}
            isVersionLoading={isVersionLoading}
            owner={owner}
            slashedTableName={slashedEntityName}
            tier={tier as TagLabel}
            version={version}
            versionHandler={versionHandler}
            versionList={versionList}
          />
        );
      }
      case EntityType.TOPIC: {
        return (
          <TopicVersion
            backHandler={backHandler}
            currentVersionData={currentVersionData}
            deleted={currentVersionData.deleted}
            isVersionLoading={isVersionLoading}
            owner={owner}
            slashedTopicName={slashedEntityName}
            tier={tier as TagLabel}
            topicFQN={entityFQN}
            version={version}
            versionHandler={versionHandler}
            versionList={versionList}
          />
        );
      }

      case EntityType.DASHBOARD: {
        return (
          <DashboardVersion
            backHandler={backHandler}
            currentVersionData={currentVersionData}
            deleted={currentVersionData.deleted}
            isVersionLoading={isVersionLoading}
            owner={owner}
            slashedDashboardName={slashedEntityName}
            tier={tier as TagLabel}
            topicFQN={entityFQN}
            version={version}
            versionHandler={versionHandler}
            versionList={versionList}
          />
        );
      }

      case EntityType.PIPELINE: {
        return (
          <PipelineVersion
            backHandler={backHandler}
            currentVersionData={currentVersionData}
            deleted={currentVersionData.deleted}
            isVersionLoading={isVersionLoading}
            owner={owner}
            slashedPipelineName={slashedEntityName}
            tier={tier as TagLabel}
            topicFQN={entityFQN}
            version={version}
            versionHandler={versionHandler}
            versionList={versionList}
          />
        );
      }

      default:
        return null;
    }
  };

  useEffect(() => {
    fetchEntityVersions();
  }, [entityFQN]);

  useEffect(() => {
    fetchCurrentVersion();
  }, [version]);

  return <>{isLoading ? <Loader /> : versionComponent()}</>;
};

export default EntityVersionPage;