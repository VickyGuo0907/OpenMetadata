---
description: This guide will help install Kafka connector and run manually
---

# Kafka

{% hint style="info" %}
**Prerequisites**

OpenMetadata is built using Java, DropWizard, Jetty, and MySQL.

1. Python 3.8 or above
{% endhint %}

### Install from PyPI

{% tabs %}
{% tab title="Install Using PyPI" %}
```bash
pip3 install 'openmetadata-ingestion[kafka]'
```
{% endtab %}
{% endtabs %}

### Run Manually

```bash
metadata ingest -c ./examples/workflows/confluent_kafka.json
```

### Configuration

{% code title="confluent_kafka.json" %}
```javascript
{
  "source": {
    "type": "kafka",
    "serviceName": "local_kafka",
    "serviceConnection": {
      "config": {
        "type": "Kafka",
        "bootstrapServers": "localhost:9092",
        "schemaRegistryURL": "http://localhost:8081",
        "consumerConfig": {},
        "schemaRegistryConfig": {}
      }
    },
    "sourceConfig": {
      "config": {
        "topicFilterPattern": {
          "excludes": ["_confluent.*"]
        }
      }
    }
 ...
```
{% endcode %}

1. **service\_name** - Service Name for this Kafka cluster. If you added Kafka cluster through OpenMetadata UI, make sure the service name matches the same.
2. **filter\_pattern** - It contains includes, excludes options to choose which pattern of datasets you want to ingest into OpenMetadata

## Publish to OpenMetadata

Below is the configuration to publish Kafka data into the OpenMetadata service.

Add `metadata-rest` sink along with `metadata-server` config

{% code title="confluent_kafka.json" %}
```javascript
{
  "source": {
    "type": "kafka",
    "serviceName": "local_kafka",
    "serviceConnection": {
      "config": {
        "type": "Kafka",
        "bootstrapServers": "localhost:9092",
        "schemaRegistryURL": "http://localhost:8081",
        "consumerConfig": {},
        "schemaRegistryConfig": {}
      }
    },
    "sourceConfig": {
      "config": {
        "topicFilterPattern": {
          "excludes": ["_confluent.*"]
        }
      }
    }
  },
  "sink": {
    "type": "metadata-rest",
    "config": {
    }
  },
  "workflowConfig": {
    "openMetadataServerConfig": {
      "hostPort": "http://localhost:8585/api",
      "authProvider": "no-auth"
    }
  }
}
```
{% endcode %}