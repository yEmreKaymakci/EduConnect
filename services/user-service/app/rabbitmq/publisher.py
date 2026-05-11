import json
import uuid
import logging
from typing import Optional
import aio_pika
from aio_pika import Message, DeliveryMode
from app.config import settings

logger = logging.getLogger(__name__)


class RabbitMQPublisher:
    def __init__(self, connection: aio_pika.RobustConnection):
        self._connection = connection
        self._channel: Optional[aio_pika.Channel] = None

    @classmethod
    async def create(cls) -> "RabbitMQPublisher":
        import asyncio
        retries = 12
        delay = 5
        for i in range(retries):
            try:
                connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
                logger.info("✅ Connected to RabbitMQ successfully.")
                return cls(connection)
            except Exception as e:
                if i == retries - 1:
                    logger.error(f"❌ Failed to connect to RabbitMQ after {retries} attempts: {e}")
                    raise e
                logger.warning(f"⚠️ RabbitMQ connection attempt {i+1}/{retries} failed. Retrying in {delay}s...")
                await asyncio.sleep(delay)

    async def _get_channel(self) -> aio_pika.Channel:
        if self._channel is None or self._channel.is_closed:
            self._channel = await self._connection.channel()
        return self._channel

    async def publish(
        self,
        routing_key: str,
        payload: dict,
        exchange_name: str = "educonnect.topic",
        correlation_id: Optional[str] = None,
        reply_to: Optional[str] = None,
    ) -> None:
        try:
            channel = await self._get_channel()
            exchange = await channel.get_exchange(exchange_name)
            message_id = str(uuid.uuid4())
            body = json.dumps(payload, default=str).encode()

            await exchange.publish(
                Message(
                    body=body,
                    content_type="application/json",
                    delivery_mode=DeliveryMode.PERSISTENT,
                    message_id=message_id,
                    correlation_id=correlation_id or message_id,
                    reply_to=reply_to,
                ),
                routing_key=routing_key,
            )
            logger.info(f"[RabbitMQ] Published to {routing_key}: {message_id}")
        except Exception as e:
            logger.error(f"[RabbitMQ] Failed to publish to {routing_key}: {e}")
            raise

    async def rpc_call(self, routing_key: str, payload: dict, timeout: float = 10.0) -> dict:
        """RPC çağrısı - sonuç beklenir"""
        channel = await self._get_channel()
        reply_queue = await channel.declare_queue("", exclusive=True, auto_delete=True)
        correlation_id = str(uuid.uuid4())
        future_result = {}

        async def on_response(message: aio_pika.IncomingMessage):
            async with message.process():
                if message.correlation_id == correlation_id:
                    future_result["data"] = json.loads(message.body)

        await reply_queue.consume(on_response)
        await self.publish(
            routing_key=routing_key,
            payload=payload,
            exchange_name="educonnect.direct",
            correlation_id=correlation_id,
            reply_to=reply_queue.name,
        )

        import asyncio
        deadline = asyncio.get_event_loop().time() + timeout
        while asyncio.get_event_loop().time() < deadline:
            if "data" in future_result:
                return future_result["data"]
            await asyncio.sleep(0.1)

        raise TimeoutError(f"RPC call to {routing_key} timed out")

    async def close(self):
        if self._connection and not self._connection.is_closed:
            await self._connection.close()
