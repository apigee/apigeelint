 var oas3 = {
  "openapi": "3.0.0",
  "info": {
    "title": "Hipster Products API",
    "description": "Products API for Hipster Application",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://guppratik-56916-eval-test.apigee.net/v1/singularity"
    }
  ],
  "paths": {
    "/products": {
      "get": {
        "summary": "Returns the range of products along with images",
        "parameters": [
          {
            "in": "header",
            "name": "x-api-key",
            "schema": {
              "type": "string"
            },
            "required": true
          }
        ],
        "tags": [
          "ProductCatalogService"
        ],
        "operationId": "getProducts",
        "responses": {
          "200": {
            "description": "A successful response.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/hipstershopListProductsResponse"
                }
              }
            }
          },
          "400": {
            "description": "Bad Request",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/400errorResponse"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/401errorResponse"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/403errorResponse"
                }
              }
            }
          },
          "404": {
            "description": "Not Found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/404errorResponse"
                }
              }
            }
          },
          "429": {
            "description": "Too Many Requests",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/429errorResponse"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/500errorResponse"
                }
              }
            }
          },
          "501": {
            "description": "Not Implemented",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/501errorResponse"
                }
              }
            }
          },
          "default": {
            "description": "Internal Server Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/errorResponse"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "hipstershopListProductsResponse": {
        "type": "object",
        "properties": {
          "products": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/hipstershopProduct"
            }
          }
        }
      },
      "hipstershopMoney": {
        "type": "object",
        "properties": {
          "currency_code": {
            "type": "string",
            "description": "The 3-letter currency code defined in ISO 4217."
          },
          "units": {
            "type": "string",
            "description": "The whole units of the amount.\nFor example if `currencyCode` is `\"USD\"`, then 1 unit is one US dollar.",
            "format": "int64"
          },
          "nanos": {
            "type": "integer",
            "description": "Number of nano (10^-9) units of the amount.\nThe value must be between -999,999,999 and +999,999,999 inclusive.\nIf `units` is positive, `nanos` must be positive or zero.\nIf `units` is zero, `nanos` can be positive, zero, or negative.\nIf `units` is negative, `nanos` must be negative or zero.\nFor example $-1.75 is represented as `units`=-1 and `nanos`=-750,000,000.",
            "format": "int32"
          }
        },
        "description": "Represents an amount of money with its currency type."
      },
      "hipstershopProduct": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "picture": {
            "type": "string"
          },
          "price_usd": {
            "$ref": "#/components/schemas/hipstershopMoney"
          },
          "categories": {
            "type": "array",
            "description": "Categories such as \"vintage\" or \"gardening\" that can be used to look up\nother related products.",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "errorResponse": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "pattern": ".+",
            "description": "apigee-specific error code",
            "example": "ErrorResponseCode"
          },
          "message": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem"
          },
          "source": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem",
            "example": "backend"
          },
          "sourceName": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem"
          }
        }
      },
      "400errorResponse": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "pattern": ".+",
            "description": "apigee-specific error code",
            "example": "invalidRequestHeader"
          },
          "message": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem",
            "example": "Bad Request request.header.content-type header is invalid when matched with regular expression: ^application/json$"
          },
          "source": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem",
            "example": "apigeePolicy"
          },
          "sourceName": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem",
            "example": "validateAndSanitizeRequest commonFunctions.js"
          }
        }
      },
      "401errorResponse": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "pattern": ".+",
            "description": "apigee-specific error code",
            "example": "InvalidAPIKey"
          },
          "message": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem",
            "example": "Invalid ApiKey"
          },
          "source": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem",
            "example": "apigeePolicy"
          },
          "sourceName": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem",
            "example": "VerifyAPIKey"
          }
        }
      },
      "429errorResponse": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "pattern": ".+",
            "description": "apigee-specific error code",
            "example": "ErrorResponseCode"
          },
          "message": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem",
            "example": "{\"fault\":{\"faultstring\":\"Spike arrest violation. Allowed rate : MessageRate{messagesPerPeriod=5, periodInMicroseconds=3000000, maxBurstMessageCount=1.0}\",\"detail\":{\"errorcode\":\"policies.ratelimit.SpikeArrestViolation\"}}}"
          },
          "source": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem",
            "example": "backend"
          },
          "sourceName": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem"
          }
        }
      },
      "403errorResponse": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "pattern": ".+",
            "description": "apigee-specific error code",
            "example": "IPDeniedAccess"
          },
          "message": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem",
            "example": "Access denied for Client IP:34.205.190.4"
          },
          "source": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem",
            "example": "apigeePolicy"
          },
          "sourceName": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem",
            "example": "checkClientIpAgainstAllowedListOfIps"
          }
        }
      },
      "404errorResponse": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "pattern": ".+",
            "description": "apigee-specific error code",
            "example": "ResourceNotFound"
          },
          "message": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem"
          },
          "source": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem",
            "example": "apigeePolicy"
          },
          "sourceName": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem",
            "example": "RaiseFaultEnterErrorFlow"
          }
        }
      },
      "500errorResponse": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "pattern": ".+",
            "description": "apigee-specific error code",
            "example": "ErrorResponseCode"
          },
          "message": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem",
          },
          "source": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem",
            "example": "backend"
          },
          "sourceName": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem"
          }
        }
      },
      "501errorResponse": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "pattern": ".+",
            "description": "apigee-specific error code",
            "example": "MethodNotImplemented"
          },
          "message": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem",
            "example": "request method POST is not Implemented"
          },
          "source": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem",
            "example": "apigeePolicy"
          },
          "sourceName": {
            "type": "string",
            "pattern": ".+",
            "description": "human-readable summary of the problem",
            "example": "RaiseFaultEnterErrorFlow"
          }
        }
      }
    }
  }
};
