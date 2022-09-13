FROM amazon/aws-lambda-nodejs:12

ARG FUNCTION_DIR="/var/task"

RUN mkdir -p ${FUNCTION_DIR}

COPY src/lambdas/async/thumbnail-generator-typescript ${FUNCTION_DIR}/

COPY src/layers/common/nodejs/*.ts ${FUNCTION_DIR}/

WORKDIR ${FUNCTION_DIR}

RUN npm install && npm run compile

CMD [ "index.handler" ]