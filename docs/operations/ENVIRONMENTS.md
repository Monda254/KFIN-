# Environment Operations Foundation

KFIN uses five conceptual environments:

| Environment | Purpose | Data rule |
| --- | --- | --- |
| Local | Individual developer work | Synthetic only |
| Test | Automated checks | Synthetic fixtures only |
| Development | Shared engineering validation | Synthetic or explicitly authorized anonymized data |
| Staging | Pre-release acceptance | Controlled non-production data |
| Production | Authorized operational deployment | Governed production data and credentials |

No local or development process should depend on an uncontrolled production endpoint. Deployment, disaster recovery, retention, expungement, disclosure and production observability require their own approved implementation scope.