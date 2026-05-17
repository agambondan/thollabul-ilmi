package lib

import (
	"context"
	"fmt"
	"io"
	"strings"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/spf13/viper"
)

const defaultLibraryBucket = "thollabul-ilmi-library"

// UploadPublicObject stores an object in MinIO and returns a browser-openable URL.
// The bucket is created and marked public-read because library resources are
// opened directly from web and mobile clients.
func UploadPublicObject(ctx context.Context, objectKey string, reader io.Reader, size int64, contentType string) (string, error) {
	client, bucket, useSSL, endpoint, err := newObjectStorageClient()
	if err != nil {
		return "", err
	}
	if err := ensurePublicBucket(ctx, client, bucket); err != nil {
		return "", err
	}
	if _, err := client.PutObject(ctx, bucket, objectKey, reader, size, minio.PutObjectOptions{ContentType: contentType}); err != nil {
		return "", err
	}

	publicURL := strings.TrimRight(viper.GetString("MINIO_PUBLIC_URL"), "/")
	if publicURL == "" {
		scheme := "http"
		if useSSL {
			scheme = "https"
		}
		publicURL = fmt.Sprintf("%s://%s", scheme, endpoint)
	}
	return fmt.Sprintf("%s/%s/%s", publicURL, bucket, objectKey), nil
}

func DeletePublicObject(ctx context.Context, objectKey string) error {
	if strings.TrimSpace(objectKey) == "" {
		return nil
	}
	client, bucket, _, _, err := newObjectStorageClient()
	if err != nil {
		return err
	}
	return client.RemoveObject(ctx, bucket, objectKey, minio.RemoveObjectOptions{})
}

func newObjectStorageClient() (*minio.Client, string, bool, string, error) {
	endpoint := envString("MINIO_ENDPOINT", "localhost:9020")
	accessKey := envString("MINIO_ACCESS", "minioadmin")
	secretKey := envString("MINIO_SECRET", "minioadmin")
	bucket := envString("MINIO_LIBRARY_BUCKET", defaultLibraryBucket)
	useSSL := viper.GetBool("MINIO_USE_SSL")

	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, "", false, "", err
	}
	return client, bucket, useSSL, endpoint, nil
}

func ensurePublicBucket(ctx context.Context, client *minio.Client, bucket string) error {
	exists, err := client.BucketExists(ctx, bucket)
	if err != nil {
		return err
	}
	if !exists {
		if err := client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{}); err != nil {
			return err
		}
	}

	policy := fmt.Sprintf(`{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"AWS": ["*"]},
    "Action": ["s3:GetObject"],
    "Resource": ["arn:aws:s3:::%s/*"]
  }]
}`, bucket)
	return client.SetBucketPolicy(ctx, bucket, policy)
}

func envString(key string, fallback string) string {
	value := viper.GetString(key)
	if value == "" {
		return fallback
	}
	return value
}
